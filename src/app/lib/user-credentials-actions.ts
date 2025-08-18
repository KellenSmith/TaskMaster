"use server";

import { prisma } from "../../prisma/prisma-client";
import { generateSalt, hashPassword } from "./auth/auth";
import { sendUserCredentials } from "./mail-service/mail-service";

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
