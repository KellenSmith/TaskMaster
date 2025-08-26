"use server";

import z from "zod";
import { prisma } from "../../../prisma/prisma-client";
import { sendUserCredentials } from "./mail-service/mail-service";
import { LoginSchema, ResetCredentialsSchema, UpdateCredentialsSchema } from "./zod-schemas";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { getLoggedInUser } from "./user-actions";
import { hashPassword, signIn, signOut } from "./auth";
import { getUrl } from "./definitions";
import { CredentialsSignin } from "next-auth";
import { allowRedirectException } from "../ui/utils";

export const login = async (parsedFieldValues: z.infer<typeof LoginSchema>): Promise<void> => {
    try {
        await signIn("credentials", {
            ...parsedFieldValues,
            callback: getUrl([GlobalConstants.LOGIN]),
            redirectTo: getUrl([GlobalConstants.HOME]),
        });
    } catch (error) {
        allowRedirectException(error);
        // Allow the error messages thrown by the auth.ts authorize function through
        if (error instanceof CredentialsSignin && error.code) {
            throw new Error(error.code);
        } else throw new Error("Failed to log in");
    }
};

export const logOut = async (): Promise<void> => {
    try {
        await signOut({
            redirectTo: getUrl([GlobalConstants.HOME]),
        });
    } catch (error) {
        allowRedirectException(error);
        throw new Error("Failed to log out");
    }
};

// Generate a random string of specified length
const generateSalt = async (): Promise<string> => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const validateUserMembership = async (userId: string): Promise<void> => {
    const generatedPassword = await generateSalt();
    let userEmail: string;
    try {
        const salt = await generateSalt();
        const hashedPassword = await hashPassword(generatedPassword, salt);
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        userEmail = user.email;

        await prisma.userCredentials.create({
            data: {
                userId: user.id,
                salt,
                hashedPassword,
            },
        });
        revalidateTag(GlobalConstants.USER);
    } catch (error) {
        console.error(error);
        throw new Error(`Failed creating user credentials`);
    }

    // Email new credentials to user email
    try {
        await sendUserCredentials(userEmail, generatedPassword);
    } catch (error) {
        console.error(error);
        throw new Error(
            "The user membership was validated but credentials could not be sent by email. The user can still reset their password",
        );
    }
};

export const resetUserCredentials = async (
    parsedFieldValues: z.infer<typeof ResetCredentialsSchema>,
): Promise<void> => {
    const userEmail: string = parsedFieldValues.email as unknown as string;
    const generatedPassword = await generateSalt();
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: userEmail,
            },
        });
        const salt = await generateSalt();
        await prisma.userCredentials.update({
            where: {
                userId: user.id,
            },
            data: {
                salt,
                hashedPassword: await hashPassword(generatedPassword, salt),
            },
        });
    } catch {
        console.error("Could not reset credentials for email: ", userEmail);
        throw new Error("Could not reset credentials");
    }

    // Email new credentials to user email
    try {
        await sendUserCredentials(userEmail, generatedPassword);
    } catch {
        throw new Error("Credentials were reset but could not be emailed to user");
    }
};

export const updateUserCredentials = async (
    fieldValues: z.infer<typeof UpdateCredentialsSchema>,
): Promise<void> => {
    try {
        const loggedInUser = await getLoggedInUser();
        const salt = await generateSalt();
        await prisma.userCredentials.update({
            where: {
                userId: loggedInUser.id,
            },
            data: {
                salt,
                hashedPassword: await hashPassword(
                    fieldValues.newPassword as unknown as string,
                    salt,
                ),
            },
        });
    } catch {
        throw new Error("Failed to update user credentials");
    }
};
