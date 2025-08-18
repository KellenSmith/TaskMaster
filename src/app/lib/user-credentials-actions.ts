"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { generateSalt, hashPassword } from "./auth/auth";
import { FormActionState } from "./definitions";
import { sendUserCredentials } from "./mail-service/mail-service";
import { ResetCredentialsSchema } from "./zod-schemas";

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
    } catch (error) {
        throw new Error(`Failed creating user credentials`);
    }

    // Email new credentials to user email
    try {
        await sendUserCredentials(userEmail, generatedPassword);
    } catch (error) {
        throw new Error(
            "The user membership was validated but credentials could not be sent by email. The user can still reset their password",
        );
    }
};

export const resetUserCredentials = async (
    fieldValues: typeof ResetCredentialsSchema.shape,
): Promise<void> => {
    const userEmail: string = fieldValues.email as unknown as string;
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
    } catch (error) {
        throw new Error("Could not reset credentials");
    }

    // Email new credentials to user email
    try {
        await sendUserCredentials(userEmail, generatedPassword);
    } catch (error) {
        throw new Error("Credentials were reset but could not be emailed to user");
    }
};
