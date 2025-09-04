"use server";

import z from "zod";
import { prisma } from "../../../prisma/prisma-client";
import { sendUserCredentials } from "./mail-service/mail-service";
import { LoginSchema, ResetCredentialsSchema, UpdateCredentialsSchema } from "./zod-schemas";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { hashPassword, signIn, signOut } from "./auth";
import { getRelativeUrl } from "./definitions";
import { CredentialsSignin } from "next-auth";
import { allowRedirectException } from "../ui/utils";

export const login = async (parsedFieldValues: z.infer<typeof LoginSchema>): Promise<void> => {
    await signIn("credentials", {
        ...parsedFieldValues,
        callback: getRelativeUrl([GlobalConstants.LOGIN]),
        redirectTo: getRelativeUrl([GlobalConstants.HOME]),
        redirect: true,
    });
};

export const logOut = async (): Promise<void> => {
    await signOut({ redirectTo: getRelativeUrl([GlobalConstants.HOME]), redirect: true });
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
    const salt = await generateSalt();
    const hashedPassword = await hashPassword(generatedPassword, salt);
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
    });
    userEmail = user.email;

    await prisma.userCredentials.create({
        data: {
            user_id: user.id,
            salt,
            hashed_password: hashedPassword,
        },
    });
    revalidateTag(GlobalConstants.USER);

    // Email new credentials to user email
    await sendUserCredentials(userEmail, generatedPassword);
};

export const resetUserCredentials = async (
    parsedFieldValues: z.infer<typeof ResetCredentialsSchema>,
): Promise<void> => {
    const userEmail: string = parsedFieldValues.email as unknown as string;
    const generatedPassword = await generateSalt();

    const user = await prisma.user.findUnique({
        where: {
            email: userEmail,
        },
    });
    const salt = await generateSalt();
    await prisma.userCredentials.update({
        where: {
            user_id: user.id,
        },
        data: {
            salt,
            hashed_password: await hashPassword(generatedPassword, salt),
        },
    });

    // Email new credentials to user email
    await sendUserCredentials(userEmail, generatedPassword);
};

export const updateUserCredentials = async (
    userId: string,
    fieldValues: z.infer<typeof UpdateCredentialsSchema>,
): Promise<void> => {
    const salt = await generateSalt();
    await prisma.userCredentials.update({
        where: {
            user_id: userId,
        },
        data: {
            salt,
            hashed_password: await hashPassword(fieldValues.newPassword as unknown as string, salt),
        },
    });
};
