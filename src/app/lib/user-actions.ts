"use server";

import { Prisma, PrismaPromise } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import GlobalConstants from "../GlobalConstants";
import { DatagridActionState } from "../ui/Datagrid";
import { decryptJWT, encryptJWT, generateUserCredentials, getUserByUniqueKey } from "./auth/auth";
import { sendUserCredentials } from "./mail-service/mail-service";
import { isMembershipExpired, LoginSchema, ResetCredentialsSchema } from "./definitions";

export const getUserById = async (
    currentState: DatagridActionState,
    userId: string,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
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

export const createUser = async (
    currentActionState: FormActionState,
    fieldValues: Prisma.UserCreateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const createdUser = await prisma.user.create({
            data: {
                ...fieldValues,
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = `User #${createdUser[GlobalConstants.ID]} ${
            createdUser[GlobalConstants.NICKNAME]
        } created successfully`;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const getAllUsers = async (
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const users = await prisma.user.findMany({
            include: {
                userCredentials: true,
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
        const loggedInUser = await getUserByUniqueKey(
            GlobalConstants.ID,
            jwtPayload[GlobalConstants.ID] as string,
        );
        // Renew JWT
        encryptJWT(loggedInUser);
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = JSON.stringify(loggedInUser);
    } else {
        newActionState.status = 404;
        newActionState.errorMsg = "";
        newActionState.result = "";
    }
    return newActionState;
};

export type UserIdentifier = {
    id?: string;
    email?: string;
};

const updateUserTransaction = (
    fieldValues: Prisma.UserUpdateInput,
    userIdentifier: UserIdentifier,
): Prisma.PrismaPromise<any> => {
    return prisma.user.update({
        where: userIdentifier as unknown as Prisma.UserWhereUniqueInput,
        data: fieldValues,
    });
};

export const updateUser = async (
    userId: string,
    currentActionState: FormActionState,
    fieldValues: Prisma.UserUpdateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    const userIdentifier: UserIdentifier = {
        [GlobalConstants.ID]: userId,
    };
    try {
        await updateUserTransaction(fieldValues, userIdentifier);
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
    fieldValues: LoginSchema,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    const newCredentials = await generateUserCredentials(fieldValues.password as string);
    try {
        await prisma.userCredentials.update({
            where: {
                email: fieldValues.email,
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

    // Check if user exists. If not, return ambiguous error message to
    // prevent revealing if the email is registered or not.
    newActionState.status = 200;
    newActionState.errorMsg = "";
    newActionState.result = "New credentials sent to your email if we have it on record";
    const user = await getUserByUniqueKey(GlobalConstants.EMAIL, userEmail);
    if (isMembershipExpired(user)) {
        return newActionState;
    }

    const generatedPassword = "123456"; // await generateSalt();
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

export const validateUserMembership = async (
    user: Prisma.UserUpdateInput,
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };

    const generatedPassword = "123456"; //TODO: await generateSalt();
    const generatedUserCredentials = (await getGeneratedUserCredentials(
        user.email as string,
        generatedPassword,
    )) as Prisma.UserCredentialsCreateInput;

    // Email new credentials to user email
    try {
        await sendUserCredentials(user.email as string, generatedPassword);
    } catch (error) {
        newActionState.status = error.statusCode;
        newActionState.result = "";
        newActionState.errorMsg = `Credentials could not be sent to user because:\n${error.message}`;
        return newActionState;
    }

    try {
        await createUserCredentialsTransaction(generatedUserCredentials);
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = "Validated membership";
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
                role: GlobalConstants.ADMIN,
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
                email: user.email as string,
            },
        });
        const deleteUser = prisma.user.delete({
            where: {
                email: user.email as string,
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
