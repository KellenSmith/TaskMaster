"use server";

import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { revalidateTag } from "next/cache";
import {
    LoginSchema,
    MembershipApplicationSchema,
    UserCreateSchema,
    UserUpdateSchema,
    UuidSchema,
} from "./zod-schemas";
import {
    notifyOfMembershipApplication,
    notifyOfValidatedMembership,
} from "./mail-service/mail-service";
import { auth, signIn, signOut } from "./auth/auth";
import { getOrganizationSettings } from "./organization-settings-actions";
import { getRelativeUrl, isUserAdmin } from "./utils";
import { getMembershipProduct, renewUserMembership } from "./user-membership-actions";

export const getUserById = async (
    userId: string,
): Promise<Prisma.UserGetPayload<{ include: { user_membership: true; skill_badges: true } }>> => {
    return await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { user_membership: true, skill_badges: true },
    });
};

export const createUser = async (formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = UserCreateSchema.parse(Object.fromEntries(formData.entries()));

    // If this user is the first user, make them an admin and validate their membership
    const userCount = await prisma.user.count();

    const { skill_badges: skill_badge_ids, ...userData } = validatedData;
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newUser = await tx.user.create({
            data: {
                ...userData,
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
        if (userCount === 0) {
            await tx.user.update({
                where: { id: newUser.id },
                data: {
                    status: UserStatus.validated,
                    role: UserRole.admin,
                },
            });
            const membershipProduct = await getMembershipProduct();
            await renewUserMembership(tx, newUser.id, membershipProduct.id);
        }
        revalidateTag(GlobalConstants.USER);
    });
};

export const submitMemberApplication = async (formData: FormData) => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = MembershipApplicationSchema.parse(Object.fromEntries(formData.entries()));

    const organizationSettings = await getOrganizationSettings();

    // Don't allow submitting an application if a message is prompted but not provided
    if (
        organizationSettings?.member_application_prompt &&
        !validatedData.member_application_prompt
    ) {
        throw new Error("Application message required but not provided.");
    }

    const userFieldValues = UserCreateSchema.parse(validatedData);

    await createUser(formData);
    await signIn("email", {
        email: userFieldValues.email,
        redirect: false,
        callback: getRelativeUrl([GlobalConstants.APPLY]),
        redirectTo: getRelativeUrl([GlobalConstants.PROFILE]),
    });

    // Send membership application to organization email
    try {
        await notifyOfMembershipApplication(validatedData);
    } catch (error) {
        console.error(error);
        // Submit the membership application despite failed notification
    }

    revalidateTag(GlobalConstants.USER);
};

export const getAllUsers = async (
    userId: string,
): Promise<
    Prisma.UserGetPayload<{
        include: {
            user_membership: true;
            skill_badges: true;
        };
    }>[]
> => {
    const loggedInUser = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { user_membership: true },
    });
    if (!isUserAdmin(loggedInUser)) {
        throw new Error("Access denied. Admins only.");
    }
    return await prisma.user.findMany({
        include: {
            user_membership: true,
            skill_badges: true,
        },
    });
};

export const updateUser = async (userId: string, formData: FormData): Promise<void> => {
    // Validate user ID format
    const validatedUserId = UuidSchema.parse(userId);
    // Revalidate input with zod schema - don't trust the client
    const validatedData = UserUpdateSchema.parse(Object.fromEntries(formData.entries()));

    const { skill_badges: skill_badge_ids, ...userData } = validatedData;
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.user.update({
            where: {
                id: validatedUserId,
            },
            data: userData,
        });
        // Update skill badges
        if (skill_badge_ids && skill_badge_ids.length > 0) {
            await tx.userSkillBadge.deleteMany({
                where: {
                    user_id: validatedUserId,
                },
            });
            await tx.userSkillBadge.createMany({
                data: skill_badge_ids.map((badgeId) => ({
                    user_id: validatedUserId,
                    skill_badge_id: badgeId,
                })),
            });
        }
    });

    revalidateTag(GlobalConstants.USER);
};

export const deleteUser = async (userId: string): Promise<void> => {
    // Validate user ID format
    const validatedUserId = UuidSchema.parse(userId);

    let admins: Prisma.UserGetPayload<true>[];

    admins = await prisma.user.findMany({
        where: {
            role: UserRole.admin,
        },
    });

    if (admins.length <= 1) {
        if (admins[0].id === validatedUserId) {
            throw new Error("You are the last admin standing. Find an heir before leaving.");
        }
    }

    const deleteUser = prisma.user.delete({
        where: {
            id: validatedUserId,
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

export const login = async (formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = LoginSchema.parse(Object.fromEntries(formData.entries()));

    // Only let existing members log in from this route
    await prisma.user.findUniqueOrThrow({ where: { email: validatedData.email } });

    await signIn("email", {
        email: validatedData.email,
        callback: getRelativeUrl([GlobalConstants.LOGIN]),
        redirectTo: getRelativeUrl([GlobalConstants.HOME]),
        redirect: false,
    });
};

export const logOut = async (): Promise<void> => {
    await signOut({ redirectTo: getRelativeUrl([GlobalConstants.HOME]), redirect: true });
};

export const validateUserMembership = async (userId: string): Promise<void> => {
    // Validate user ID format
    const validatedUserId = UuidSchema.parse(userId);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const validatedUser = await tx.user.update({
            where: { id: validatedUserId },
            data: { status: UserStatus.validated },
        });

        // Notify the new member of their validated status
        await notifyOfValidatedMembership(validatedUser.email);
    });

    revalidateTag(GlobalConstants.USER);
};
