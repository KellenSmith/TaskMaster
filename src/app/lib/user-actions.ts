"use server";

import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { revalidateTag } from "next/cache";
import z from "zod";
import {
    LoginSchema,
    MembershipApplicationSchema,
    UserCreateSchema,
    UserUpdateSchema,
} from "./zod-schemas";
import { notifyOfMembershipApplication } from "./mail-service/mail-service";
import { auth, signIn, signOut } from "./auth/auth";
import { getOrganizationSettings } from "./organization-settings-actions";
import { getRelativeUrl } from "./utils";

export const getUserById = async (
    userId: string,
): Promise<Prisma.UserGetPayload<{ include: { user_membership: true; skill_badges: true } }>> => {
    return await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { user_membership: true, skill_badges: true },
    });
};

export const createUser = async (
    parsedFieldValues: z.infer<typeof UserCreateSchema>,
): Promise<void> => {
    // If this user is the first user, make them an admin and validate their membership
    const userCount = await prisma.user.count();

    const { skill_badges: skill_badge_ids, ...userData } = parsedFieldValues;
    await prisma.user.create({
        data: {
            ...userData,
            ...(userCount === 0 && {
                status: UserStatus.validated,
                role: UserRole.admin,
            }),
            ...(skill_badge_ids && {
                skill_badges: {
                    createMany: {
                        data: skill_badge_ids.map((badgeId) => ({
                            skill_badge_id: badgeId,
                        })),
                    },
                },
            }),
        },
    });
    revalidateTag(GlobalConstants.USER);
};

export const submitMemberApplication = async (
    parsedFieldValues: z.infer<typeof MembershipApplicationSchema>,
) => {
    const organizationSettings = await getOrganizationSettings();

    // Don't allow submitting an application if a message is prompted but not provided
    if (
        organizationSettings?.member_application_prompt &&
        !parsedFieldValues.member_application_prompt
    ) {
        throw new Error("Application message required but not provided.");
    }

    // Send membership application to organization email
    try {
        await notifyOfMembershipApplication(parsedFieldValues);
    } catch (error) {
        console.error(error);
        // Submit the membership application despite failed notification
    }

    const userFieldValues = UserCreateSchema.parse(parsedFieldValues);
    await createUser(userFieldValues);
    await signIn("email", {
        email: userFieldValues.email,
        redirect: false,
        callback: getRelativeUrl([GlobalConstants.APPLY]),
        redirectTo: getRelativeUrl([GlobalConstants.PROFILE]),
    });
    revalidateTag(GlobalConstants.USER);
};

export const getAllUsers = async (): Promise<
    Prisma.UserGetPayload<{
        include: {
            user_membership: true;
            skill_badges: true;
        };
    }>[]
> => {
    return await prisma.user.findMany({
        include: {
            user_membership: true,
            skill_badges: true,
        },
    });
};

export const updateUser = async (
    userId: string,
    parsedFieldValues: z.infer<typeof UserUpdateSchema>,
): Promise<void> => {
    const { skill_badges: skill_badge_ids, ...userData } = parsedFieldValues;
    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: {
                id: userId,
            },
            data: userData,
        });
        // Update skill badges
        if (skill_badge_ids && skill_badge_ids.length > 0) {
            await tx.userSkillBadge.deleteMany({
                where: {
                    user_id: userId,
                },
            });
            await tx.userSkillBadge.createMany({
                data: skill_badge_ids.map((badgeId) => ({
                    user_id: userId,
                    skill_badge_id: badgeId,
                })),
            });
        }
    });

    revalidateTag(GlobalConstants.USER);
};

export const deleteUser = async (userId: string): Promise<void> => {
    let admins: Prisma.UserGetPayload<true>[];

    admins = await prisma.user.findMany({
        where: {
            role: UserRole.admin,
        },
    });

    if (admins.length <= 1) {
        if (admins[0].id === userId) {
            throw new Error("You are the last admin standing. Find an heir before leaving.");
        }
    }

    const deleteUser = prisma.user.delete({
        where: {
            id: userId,
        } as unknown as Prisma.UserWhereUniqueInput,
    });

    /**
     * Delete dependencies and user in a transaction where all actions must
     * succeed or no action is taken to preserve data integrity.
     */
    await prisma.$transaction([deleteUser]);

    // TODO: Check revalidation tags for all caches
    revalidateTag(GlobalConstants.USER);
    revalidateTag(GlobalConstants.USER_MEMBERSHIP);
    revalidateTag(GlobalConstants.PARTICIPANT_USERS);
    revalidateTag(GlobalConstants.EVENT);
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

export const login = async (parsedFieldValues: z.infer<typeof LoginSchema>): Promise<void> => {
    // Only let existing members log in from this route
    await prisma.user.findUniqueOrThrow({ where: { email: parsedFieldValues.email } });

    await signIn("email", {
        email: parsedFieldValues.email,
        callback: getRelativeUrl([GlobalConstants.LOGIN]),
        redirectTo: getRelativeUrl([GlobalConstants.HOME]),
        redirect: false,
    });
};

export const logOut = async (): Promise<void> => {
    await signOut({ redirectTo: getRelativeUrl([GlobalConstants.HOME]), redirect: true });
};

export const validateUserMembership = async (userId: string): Promise<void> => {
    await prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.validated },
    });
};
