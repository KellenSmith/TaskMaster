import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { cookies } from "next/headers";
import { auth } from "./auth/auth";
import { Language } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/client";
import { isMemberBlacklisted } from "./utils";

export const getUserCacheTag = async (userId: string) => `${GlobalConstants.USER}:${userId}`;

const getCachedUserById = async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId },
        include: { user_membership: true, skill_badges: true, blacklist_entry: true },
    });
};

export const getUserLanguage = async () => {
    const cookieStore = await cookies();
    const languageValue = cookieStore.get(GlobalConstants.LANGUAGE)?.value;
    if (languageValue && Object.values(Language).includes(languageValue as Language)) {
        return languageValue as Language;
    }
    return Language.english;
};

export const getLoggedInUser = async (): Promise<Prisma.UserGetPayload<{
    include: { user_membership: true; skill_badges: true; blacklist_entry: true };
}> | null> => {
    try {
        const authResult = await auth();
        if (!authResult?.user?.id) return null;
        const loggedInUser = await getCachedUserById(authResult.user.id);
        if (isMemberBlacklisted(loggedInUser)) return null;
        return loggedInUser;
    } catch {
        return null;
    }
};

export const getCachedActiveMembers = async (): Promise<
    Prisma.UserGetPayload<{
        select: { id: true; nickname: true; skill_badges: true };
    }>[]
> => {
    return await prisma.user.findMany({
        where: {
            user_membership: {
                expires_at: {
                    gt: dayjs.utc().toISOString(),
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
