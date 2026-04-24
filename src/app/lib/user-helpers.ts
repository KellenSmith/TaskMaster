"use server";

import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import dayjs from "./dayjs";
import { cookies } from "next/headers";
import { auth } from "./auth/auth";
import { Language } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/client";

export const getUserLanguage = async () => {
    const cookieStore = await cookies();
    const languageValue = cookieStore.get(GlobalConstants.LANGUAGE)?.value;
    if (languageValue && Object.values(Language).includes(languageValue as Language)) {
        return languageValue as Language;
    }
    return Language.english;
};

export const getLoggedInUser = async (): Promise<Prisma.UserGetPayload<{
    include: { user_membership: true; skill_badges: true };
}> | null> => {
    const authResult = await auth();
    if (!authResult?.user) return null;
    const loggedInUser = await prisma.user.findUnique({
        where: { id: authResult.user.id },
        include: { user_membership: true, skill_badges: true },
    });
    return loggedInUser;
};

export const getActiveMembers = async (): Promise<
    Prisma.UserGetPayload<{
        select: { id: true; nickname: true; skill_badges: true };
    }>[]
> => {
    return await prisma.user.findMany({
        where: {
            user_membership: {
                expires_at: {
                    gt: dayjs().toISOString(),
                },
            },
        },
        select: {
            id: true,
            nickname: true,
            skill_badges: true,
        },
    });
};
