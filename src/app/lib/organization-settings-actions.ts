"use server";

import { prisma } from "../../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import z from "zod";
import { OrganizationSettingsUpdateSchema } from "./zod-schemas";
import { Prisma } from "@prisma/client";
import { del } from "@vercel/blob";

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

export const getOrganizationName = async (): Promise<string> => {
    const orgSettings = await getOrganizationSettings();
    return orgSettings?.organization_name || process.env.NEXT_PUBLIC_ORG_NAME || "Task Master";
};

export const updateOrganizationSettings = async (
    parsedFieldValues: z.infer<typeof OrganizationSettingsUpdateSchema>,
): Promise<void> => {
    const settings = await getOrganizationSettings();
    // If a new logo_url is provided and differs from the existing one,
    // attempt to delete the old blob from Vercel Blob storage.
    await deleteOldBlob(settings.logo_url, parsedFieldValues.logo_url);

    await prisma.organizationSettings.update({
        where: {
            id: settings?.id,
        },
        data: parsedFieldValues,
    });
    revalidateTag(GlobalConstants.ORGANIZATION_SETTINGS);
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
