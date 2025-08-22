"use server";

import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { decryptJWT, getUserCookie } from "./auth/auth";
import { DatagridActionState } from "./definitions";
import dayjs from "dayjs";
import { validateUserMembership } from "./user-credentials-actions";
import { revalidateTag } from "next/cache";
import z from "zod";
import { UserCreateSchema, UserUpdateSchema } from "./zod-schemas";

export const getUserById = async (
    userId: string,
): Promise<Prisma.UserGetPayload<{ include: { userMembership: true } }>> => {
    try {
        return await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: { userMembership: true },
        });
    } catch (error) {
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
    } catch (error) {
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

export const getAllUsers = async (): Promise<
    Prisma.UserGetPayload<{ include: { userCredentials: true; userMembership: true } }>[]
> => {
    try {
        return await prisma.user.findMany({
            include: {
                userCredentials: true,
                userMembership: true,
            },
        });
    } catch {
        throw new Error("Failed to get all users");
    }
};

export const getLoggedInUser = async (): Promise<Prisma.UserGetPayload<{
    include: { userMembership: true };
}> | null> => {
    try {
        const userCookie = await getUserCookie();
        const jwtPayload = await decryptJWT(userCookie);
        return await prisma.user.findUniqueOrThrow({
            where: { id: jwtPayload.id },
            include: { userMembership: true },
        });
    } catch {
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
        const deleteReservedInEventsPromise = prisma.reserveInEvent.deleteMany({
            where: {
                userId: userId,
            },
        });
        const deleteParticipantInEventsPromise = prisma.participantInEvent.deleteMany({
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
    } catch (error) {
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
    } catch (error) {
        throw new Error("Failed to get active members");
    }
};
