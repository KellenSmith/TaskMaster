import { Prisma } from "../../prisma/generated/client";
import { prisma } from "../../prisma/prisma-client";

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
