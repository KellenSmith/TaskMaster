"use server";

import { prisma } from "../../../prisma/prisma-client";
import { v4 as uuidv4 } from "uuid";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import z from "zod";
import { OrganizationSettingsUpdateSchema } from "./zod-schemas";
import { Prisma } from "@prisma/client";

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
    fieldValues: z.infer<typeof OrganizationSettingsUpdateSchema>,
): Promise<void> => {
    try {
        const settings = await getOrganizationSettings();
        await prisma.organizationSettings.update({
            where: {
                id: settings?.id,
            },
            data: fieldValues,
        });
        revalidateTag(GlobalConstants.ORGANIZATION_SETTINGS);
    } catch {
        throw new Error(`Failed to update organization settings`);
    }
};
