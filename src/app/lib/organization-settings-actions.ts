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
    // Only attempt deletion for URLs that look like Vercel blob URLs to avoid
    // trying to delete external resources.

    await updateBlob(settings.logo_url, parsedFieldValues.logo_url);

    await prisma.organizationSettings.update({
        where: {
            id: settings?.id,
        },
        data: parsedFieldValues,
    });
    revalidateTag(GlobalConstants.ORGANIZATION_SETTINGS);
};

export const updateBlob = async (oldUrl: string, blobUrl: string): Promise<void> => {
    if (oldUrl && blobUrl && oldUrl !== blobUrl) {
        try {
            // Quick guard: Vercel public blob URLs contain 'blob.vercel-storage.com'
            if (blobUrl.includes("blob.vercel-storage.com")) {
                await del(blobUrl);
            }
        } catch (error) {
            // Don't block the database update if deletion fails. Log for inspection.
            console.error("Failed to update logo blob:", error);
        }
    }
};

export const deleteBlob = async (blobUrl: string): Promise<void> => {
    if (blobUrl) {
        try {
            // Quick guard: Vercel public blob URLs contain 'blob.vercel-storage.com'
            if (blobUrl.includes("blob.vercel-storage.com")) {
                await del(blobUrl);
            }
        } catch (error) {
            // Log for inspection.
            console.error(`Failed to delete logo blob with url ${blobUrl}:`, error);
        }
    }
};
