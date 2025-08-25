"use server";

import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { decryptJWT, getUserCookie } from "./auth";
import dayjs from "dayjs";
import { validateUserMembership } from "./user-credentials-actions";
import { revalidateTag } from "next/cache";
import z from "zod";
import { MembershipApplicationSchema, UserCreateSchema, UserUpdateSchema } from "./zod-schemas";
import { notifyOfMembershipApplication } from "./mail-service/mail-service";

/**
 * Simple in-memory cache for the logged-in user to prevent race conditions and reduce redundant calls.
 *
 * Why we need this cache:
 * - getLoggedInUser() is often called multiple times in quick succession across different components
 * - Each call involves: cookie access → JWT decryption → database query
 * - Race conditions can occur when multiple calls happen simultaneously, especially with cookie access
 * - The second call might fail due to timing issues with the cookies() API in Next.js
 *
 * How it works:
 * - Stores the user result and a timestamp for when it was cached
 * - If a subsequent call happens within CACHE_DURATION, returns the cached result
 * - Cache is invalidated after CACHE_DURATION milliseconds to ensure fresh data
 * - Both successful and failed results are cached to prevent repeated failed attempts
 */
let userCache: {
    user: Prisma.UserGetPayload<{ include: { userMembership: true } }> | null;
    timestamp: number;
} | null = null;
const CACHE_DURATION = 5000; // Cache for 5 seconds - short enough to stay fresh, long enough to prevent race conditions

export const getUserById = async (
    userId: string,
): Promise<Prisma.UserGetPayload<{ include: { userMembership: true } }>> => {
    try {
        return await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: { userMembership: true },
        });
    } catch {
        throw new Error("Failed to get user");
    }
};

export const createUser = async (
    parsedFieldValues: z.infer<typeof UserCreateSchema>,
): Promise<void> => {
    let createdUserId: string;
    try {
        const createdUser = await prisma.user.create({
            data: {
                ...parsedFieldValues,
            },
        });
        createdUserId = createdUser.id;
    } catch {
        throw new Error("Failed creating user");
    }

    try {
        // If this user is the first user, make them an admin and validate their membership
        const userCount = await prisma.user.count();
        if (userCount === 1 && createdUserId) {
            await prisma.user.update({
                where: { id: createdUserId },
                data: { role: UserRole.admin },
            });
            await validateUserMembership(createdUserId);
        }
    } catch {
        throw new Error("Failed validating user membership");
    }
    revalidateTag(GlobalConstants.USER);
};

export const submitMemberApplication = async (
    parsedFieldValues: z.infer<typeof MembershipApplicationSchema>,
) => {
    try {
        const userFieldValues = UserCreateSchema.parse(parsedFieldValues);
        await createUser(userFieldValues);

        // Send membership application to organization email
        await notifyOfMembershipApplication(
            userFieldValues,
            parsedFieldValues.memberApplicationPrompt,
        );

        revalidateTag(GlobalConstants.USER);
    } catch {
        throw new Error("Failed to submit membership application");
    }
};

export const getAllUsers = async (): Promise<
    Prisma.UserGetPayload<{
        include: { userCredentials: { select: { id: true } }; userMembership: true };
    }>[]
> => {
    try {
        return await prisma.user.findMany({
            include: {
                userCredentials: { select: { id: true } },
                userMembership: true,
            },
        });
    } catch {
        throw new Error("Failed to get all users");
    }
};

/**
 * Retrieves the currently logged-in user from the authentication cookie and database.
 *
 * This function implements a short-term cache to prevent issues when called multiple times
 * in quick succession (common in React server components).
 *
 * Process:
 * 1. Check if we have a valid cached result (within CACHE_DURATION)
 * 2. If no cache, retrieve the user cookie containing the JWT
 * 3. Decrypt and verify the JWT to get the user ID
 * 4. Query the database for the full user record with membership info
 * 5. Cache the result (success or failure) to prevent repeated calls
 *
 * @returns User object with membership info, or null if not authenticated/error occurs
 */
export const getLoggedInUser = async (): Promise<Prisma.UserGetPayload<{
    include: { userMembership: true };
}> | null> => {
    // Check cache first - prevents race conditions when function is called multiple times rapidly
    const now = Date.now();
    if (userCache && now - userCache.timestamp < CACHE_DURATION) {
        return userCache.user; // Return cached result if still valid
    }

    try {
        // Step 1: Get the authentication cookie containing the JWT
        const userCookie = await getUserCookie();
        if (!userCookie) {
            // No cookie means user is not logged in - cache this result
            userCache = { user: null, timestamp: now };
            return null;
        }

        // Step 2: Decrypt and verify the JWT to extract user information
        const jwtPayload = await decryptJWT(userCookie);
        if (!jwtPayload) {
            // JWT is invalid/expired - cache this result to prevent repeated attempts
            userCache = { user: null, timestamp: now };
            return null;
        }

        // Step 3: Query database for complete user record with membership details
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: jwtPayload.id },
            include: { userMembership: true },
        });
        // TODO: Check if this works
        // await encryptJWT(user); // Refresh JWT to extend session

        // Step 4: Cache the successful result
        userCache = { user, timestamp: now };
        return user;
    } catch {
        // Cache failed attempts to prevent repeated database calls on errors
        userCache = { user: null, timestamp: now };
        return null;
    }
};

export const updateUser = async (
    userId: string,
    fieldValues: z.infer<typeof UserUpdateSchema>,
): Promise<void> => {
    try {
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: fieldValues,
        });
        revalidateTag(GlobalConstants.USER);
    } catch {
        throw new Error(`Failed to update user`);
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    let admins: Prisma.UserGetPayload<true>[];
    try {
        admins = await prisma.user.findMany({
            where: {
                role: UserRole.admin,
            },
        });
    } catch {
        throw new Error("Failed to check admin count");
    }
    if (admins.length <= 1) {
        if (admins[0].id === userId) {
            throw new Error("You are the last admin standing. Find an heir before leaving.");
        }
    }

    try {
        const deleteReservedInEventsPromise = prisma.eventReserve.deleteMany({
            where: {
                userId: userId,
            },
        });
        const deleteParticipantInEventsPromise = prisma.eventParticipant.deleteMany({
            where: {
                userId: userId,
            },
        });
        const deleteMembershipPromise = prisma.userMembership.deleteMany({
            where: {
                userId: userId,
            },
        });
        const deleteCredentialsPromise = prisma.userCredentials.deleteMany({
            where: {
                userId: userId,
            },
        });

        const deleteUser = prisma.user.delete({
            where: {
                id: userId,
            } as unknown as Prisma.UserWhereUniqueInput,
        });

        /**
         * Delete dependencies and user in a transaction where all actions must
         * succeed or no action is taken to preserve data integrity.
         */
        await prisma.$transaction([
            deleteReservedInEventsPromise,
            deleteParticipantInEventsPromise,
            deleteMembershipPromise,
            deleteCredentialsPromise,
            deleteUser,
        ]);
        revalidateTag(GlobalConstants.USER);
        revalidateTag(GlobalConstants.USER_CREDENTIALS);
        revalidateTag(GlobalConstants.USER_MEMBERSHIP);
        revalidateTag(GlobalConstants.PARTICIPANT_USERS);
        revalidateTag(GlobalConstants.RESERVE_USERS);
    } catch {
        throw new Error("Failed to delete user");
    }
};

export const getActiveMembers = async (): Promise<
    Prisma.UserGetPayload<{ select: { id: true; nickname: true } }>[]
> => {
    try {
        return await prisma.user.findMany({
            where: {
                userMembership: {
                    expiresAt: {
                        gt: dayjs().toISOString(),
                    },
                },
            },
            select: {
                id: true,
                nickname: true,
            },
        });
    } catch {
        throw new Error("Failed to get active members");
    }
};
