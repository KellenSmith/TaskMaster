"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "./definitions";

export const getOrganizationSettings = async () => {
    let orgSettings = await prisma.organizationSettings.findFirst();
    if (!orgSettings) {
        orgSettings = await prisma.organizationSettings.create({});
    }
    return orgSettings;
};

export const updateOrganizationSettings = async (
    currentActionState: FormActionState,
    fieldValues: Prisma.UserCreateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const settings = await getOrganizationSettings();
        await prisma.organizationSettings.update({
            where: {
                organizationName: settings?.organizationName,
            },
            data: fieldValues,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Updated settings successfully`;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};
