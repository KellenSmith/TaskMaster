"use server";

import { prisma } from "../../../prisma/prisma-client";
import { v4 as uuidv4 } from "uuid";
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
        // Some DB setups may not have the server-side default configured for the id column.
        // Generate an id client-side to ensure the create call doesn't attempt to write a null id.
        orgSettings = await prisma.organizationSettings.create({ data: { id: uuidv4() } });
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
            console.error("Failed to delete logo blob:", error);
        }
    }
};
