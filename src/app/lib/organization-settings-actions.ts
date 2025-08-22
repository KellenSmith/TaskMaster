"use server";

import { OrganizationSettings } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import z from "zod";
import { OrganizationSettingsUpdateSchema } from "./zod-schemas";

export const getOrganizationSettings = async (): Promise<OrganizationSettings> => {
    let orgSettings = await prisma.organizationSettings.findFirst();
    if (!orgSettings) {
        orgSettings = await prisma.organizationSettings.upsert({
            where: { organizationName: process.env.NEXT_PUBLIC_ORG_NAME || "Task Master" },
            update: {},
            create: {},
        });
    }
    return orgSettings;
};

export const getOrganizationName = async (): Promise<string> => {
    const orgSettings = await getOrganizationSettings();
    return orgSettings?.organizationName || process.env.NEXT_PUBLIC_ORG_NAME || "Task Master";
};

export const updateOrganizationSettings = async (
    fieldValues: z.infer<typeof OrganizationSettingsUpdateSchema>,
): Promise<void> => {
    try {
        const settings = await getOrganizationSettings();
        await prisma.organizationSettings.update({
            where: {
                organizationName: settings?.organizationName,
            },
            data: fieldValues,
        });
        revalidateTag(GlobalConstants.ORGANIZATION_SETTINGS);
    } catch (error) {
        throw new Error(`Failed to update organization settings`);
    }
};
