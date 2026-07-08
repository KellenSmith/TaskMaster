"use server";

import { prisma } from "../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { OrganizationSettingsUpdateSchema } from "./zod-schemas";
import { del } from "@vercel/blob";
import { getOrganizationSettings } from "./organization-settings-helpers";
import { sanitizeFormData } from "./html-sanitizer";

export const updateOrganizationSettings = async (formData: FormData): Promise<void> => {
    // Sanitize rich text field data
    const sanitizedFormData = sanitizeFormData(Object.fromEntries(formData.entries()));
    // Revalidate input with zod schema - don't trust the client
    const validatedData = OrganizationSettingsUpdateSchema.parse(sanitizedFormData);

    const settings = await getOrganizationSettings();
    // If a new logo_url is provided and differs from the existing one,
    // attempt to delete the old blob from Vercel Blob storage.
    if (settings) await deleteOldBlob(settings.logo_url, validatedData.logo_url);

    await prisma.organizationSettings.upsert({
        where: {
            id: settings?.id,
        },
        update: validatedData,
        create: validatedData,
    });
    revalidateTag(GlobalConstants.ORGANIZATION_SETTINGS, "max");
};

export const deleteOldBlob = async (
    oldBlobUrl: string | null,
    updateBlobUrl?: string | null,
): Promise<void> => {
    // Only delete if old blob exists and the new url is not equal to the old
    if (oldBlobUrl && oldBlobUrl !== updateBlobUrl) {
        try {
            await del(oldBlobUrl);
        } catch (error) {
            // Log for inspection.
            console.error(`Failed to delete logo blob with url ${oldBlobUrl}:`, error);
        }
    }
};
