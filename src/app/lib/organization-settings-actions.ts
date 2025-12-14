"use server";

import { prisma } from "../../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { OrganizationSettingsUpdateSchema } from "./zod-schemas";
import { Prisma } from "@prisma/client";
import { del } from "@vercel/blob";
import { fileUploadFields } from "../ui/form/FieldCfg";

export const getOrganizationSettings = async (): Promise<
    Prisma.OrganizationSettingsGetPayload<true>
> => {
    let orgSettings = await prisma.organizationSettings.findFirst();
    if (!orgSettings) {
        // Create using an explicit empty `data` so Prisma uses database defaults.
        orgSettings = await prisma.organizationSettings.create({ data: {} });
    }
    return orgSettings;
};

export const updateOrganizationSettings = async (formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = OrganizationSettingsUpdateSchema.parse(
        Object.fromEntries(formData.entries()),
    );

    const settings = await getOrganizationSettings();
    // If a new logo_url is provided and differs from the existing one,
    // attempt to delete the old blob from Vercel Blob storage.
    for (const fieldId of fileUploadFields) {
        if (validatedData[fieldId]) {
            await deleteOldBlob(settings[fieldId], validatedData[fieldId]);
        }
    }

    await prisma.organizationSettings.update({
        where: {
            id: settings?.id,
        },
        data: validatedData,
    });
    revalidateTag(GlobalConstants.ORGANIZATION_SETTINGS, "max");
};

export const deleteOldBlob = async (
    oldBlobUrl: string,
    updateBlobUrl: string = null,
): Promise<void> => {
    // Only delete if the new url is not equal to the old
    if (oldBlobUrl && oldBlobUrl !== updateBlobUrl) {
        try {
            // Quick guard: Vercel public blob URLs contain 'blob.vercel-storage.com'
            // Only attempt deletion for URLs that look like Vercel blob URLs to avoid
            // trying to delete external resources.

            if (oldBlobUrl.includes("blob.vercel-storage.com")) {
                await del(oldBlobUrl);
            }
        } catch (error) {
            // Log for inspection.
            console.error(`Failed to delete logo blob with url ${oldBlobUrl}:`, error);
        }
    }
};
