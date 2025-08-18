"use server";

import { Prisma, PrismaPromise, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { decryptJWT, generateSalt, generateUserCredentials } from "./auth/auth";
import { sendUserCredentials } from "./mail-service/mail-service";
import { DatagridActionState, FormActionState, ResetCredentialsSchema } from "./definitions";
import dayjs from "dayjs";
import { validateUserMembership } from "./user-credentials-actions";
import { LoginSchema } from "./zod-schemas";

export const getUserById = async (
    currentState: DatagridActionState,
    userId: string,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: { userMembership: true },
        });
        newActionState.status = 200;
        newActionState.result = [user];
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const createUser = async (fieldValues: Prisma.UserCreateInput): Promise<void> => {
    let createdUserId: string;
    try {
        const createdUser = await prisma.user.create({
            data: {
                ...fieldValues,
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
};

export const getAllUsers = async (
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const users = await prisma.user.findMany({
            include: {
                userCredentials: true,
                userMembership: true,
            },
        });
        newActionState.status = 200;
        newActionState.result = users;
        newActionState.errorMsg = "";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const getLoggedInUser = async (
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    const jwtPayload = await decryptJWT();
    if (jwtPayload) {
        const loggedInUser = await prisma.user.findUnique({
            where: { id: jwtPayload[GlobalConstants.ID] as string },
            include: { userMembership: true },
        });
        if (!loggedInUser) {
            newActionState.status = 404;
            newActionState.errorMsg = "";
            newActionState.result = "";
            return newActionState;
        }
        // Renew JWT
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = JSON.stringify(loggedInUser);
    } else {
        console.log(2);
        newActionState.status = 404;
        newActionState.errorMsg = "";
        newActionState.result = "";
    }
    return newActionState;
};

export const updateUser = async (
    userId: string,
    currentActionState: FormActionState,
    fieldValues: Prisma.UserUpdateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: fieldValues,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Updated successfully`;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = null;
    }
    return newActionState;
};

export const updateUserCredentials = async (
    currentActionState: FormActionState,
    fieldValues: typeof LoginSchema.shape,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    const newCredentials = await generateUserCredentials(fieldValues.password as unknown as string);
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: fieldValues.email as unknown as string,
            },
        });
        await prisma.userCredentials.update({
            where: {
                userId: user.id,
            },
            data: newCredentials,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Updated successfully";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

const createUserCredentialsTransaction = (
    generatedUserCredentials: Prisma.UserCredentialsCreateInput,
): PrismaPromise<any> => {
    const transaction = prisma.userCredentials.create({
        data: generatedUserCredentials,
    });
    return transaction;
};

export const resetUserCredentials = async (
    currentActionState: FormActionState,
    fieldValues: ResetCredentialsSchema,
) => {
    const newActionState = { ...currentActionState };
    const userEmail = fieldValues.email;

    // Check if user has existing credentials. If not, return ambiguous error message to
    // prevent revealing if the email is registered or not.
    newActionState.status = 200;
    newActionState.errorMsg = "";
    newActionState.result = "New credentials sent to your email if we have it on record";
    const user = await prisma.user.findUnique({
        where: {
            email: userEmail,
        },
    });
    const userCredentials = await prisma.userCredentials.findUnique({
        where: {
            userId: user.id,
        },
    });
    if (!userCredentials) {
        return newActionState;
    }

    const generatedPassword = await generateSalt();
    const generatedUserCredentials = (await getGeneratedUserCredentials(
        userEmail,
        generatedPassword,
    )) as Prisma.UserCredentialsCreateInput;

    // Email new credentials to user email
    try {
        await sendUserCredentials(userEmail, generatedPassword);
    } catch (error) {
        newActionState.status = error.statusCode;
        newActionState.result = "";
        newActionState.errorMsg = `Credentials could not be sent to user because:\n${error.message}`;
        return newActionState;
    }

    try {
        const deleteCredentialsTransaction = prisma.userCredentials.deleteMany({
            where: {
                [GlobalConstants.EMAIL]: userEmail,
            },
        });
        const createCredentialsTransaction =
            createUserCredentialsTransaction(generatedUserCredentials);
        await prisma.$transaction([deleteCredentialsTransaction, createCredentialsTransaction]);
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

const getGeneratedUserCredentials = async (
    userEmail: string,
    generatedPassword: string,
): Promise<Prisma.UserCredentialsCreateWithoutUserInput> => {
    const generatedUserCredentials = await generateUserCredentials(generatedPassword);
    generatedUserCredentials[GlobalConstants.EMAIL] = userEmail;
    return generatedUserCredentials;
};

export const renewUserMembership = async (
    userId: string,
    membershipId: string,
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const membership = await prisma.membership.findUniqueOrThrow({
            where: { id: membershipId },
        });
        const userMembership = await prisma.userMembership.findUnique({
            where: { userId: userId },
        });

        await prisma.userMembership.upsert({
            where: { userId: userId },
            update: {
                membershipId: membershipId,
                expiresAt:
                    // If the membership is the same, extend the expiration date
                    userMembership?.membershipId === membershipId
                        ? dayjs(userMembership.expiresAt)
                              .add(membership.duration, "d")
                              .toISOString()
                        : // If the membership is different, reset the expiration date
                          dayjs().add(membership.duration, "d").toISOString(),
            },
            // If no membership exists, create a new one
            create: {
                userId: userId,
                membershipId: membershipId,
                expiresAt: dayjs().add(membership.duration, "d").toISOString(),
            },
        });
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const deleteUser = async (
    user: Prisma.UserUpdateInput,
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const adminCount = await prisma.user.count({
            where: {
                role: UserRole.admin,
            },
        });

        if (adminCount <= 1) {
            newActionState.status = 400;
            newActionState.errorMsg =
                "You are the last admin standing. Find an heir before leaving.";
            newActionState.result = "";
            return newActionState;
        }
        const deleteCredentials = prisma.userCredentials.deleteMany({
            where: {
                userId: user.id as string,
            },
        });
        const deleteUser = prisma.user.delete({
            where: {
                id: user.id as string,
            } as unknown as Prisma.UserWhereUniqueInput,
        });

        /**
         * Delete credentials and user in a transaction where all actions must
         * succeed or no action is taken to preserve data integrity.
         */
        await prisma.$transaction([deleteCredentials, deleteUser]);

        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Deleted successfully";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const getUserEvents = async (
    userId: string,
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const events = await prisma.event.findMany({
            where: {
                OR: [
                    {
                        participantUsers: {
                            some: {
                                userId: userId,
                            },
                        },
                    },
                    {
                        hostId: userId,
                    },
                ],
            },
        });
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = events;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const getUserNicknames = async (
    userIds: string[],
    currentActionState: DatagridActionState,
) => {
    const newActionState = { ...currentActionState };

    try {
        const userNicknames = await prisma.user.findMany({
            where: {
                id: {
                    in: userIds,
                },
            },
            select: {
                id: true,
                nickname: true,
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = userNicknames;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const getActiveMembers = async (currentActionState: DatagridActionState) => {
    const newActionState = { ...currentActionState };
    try {
        const activeMembers = await prisma.user.findMany({
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
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = activeMembers;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};
