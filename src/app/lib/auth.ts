"use server";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import GlobalConstants from "./../GlobalConstants";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import dayjs from "dayjs";
import { revalidateTag } from "next/cache";
import { LoginSchema } from "./zod-schemas";
import z from "zod";
import { serverRedirect } from "./definitions";

// Generate a random string of specified length
export const generateSalt = async (): Promise<string> => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

// Hash a password using SHA-256 and salt
export const hashPassword = async (password: string, salt: string): Promise<string> => {
    // Combine password and salt
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);

    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

    return hashHex;
};

export const generateUserCredentials = async (
    password: string,
): Promise<Prisma.UserCredentialsCreateWithoutUserInput> => {
    const salt = await generateSalt();
    return {
        salt,
        hashedPassword: await hashPassword(password, salt),
    };
};

export const login = async (parsedFieldValues: z.infer<typeof LoginSchema>): Promise<void> => {
    try {
        // Everyone who applied for membership exists in the database
        const loggedInUser = await prisma.user.findUnique({
            where: {
                email: parsedFieldValues.email,
            },
            include: {
                userCredentials: true,
                userMembership: true,
            },
        });
        if (!loggedInUser) throw new Error("Please apply for membership");
        if (!loggedInUser.userCredentials) throw new Error("Membership application pending");

        // All validated members have credentials
        const userCredentials = await prisma.userCredentials.findUnique({
            where: {
                userId: loggedInUser.id,
            } as any as Prisma.UserCredentialsWhereUniqueInput,
        });
        if (!userCredentials) throw new Error("Invalid credentials");

        // Match hashed password to stored hashed password
        const hashedPassword = await hashPassword(
            parsedFieldValues.password as unknown as string,
            userCredentials[GlobalConstants.SALT],
        );
        const passwordsMatch = hashedPassword === userCredentials.hashedPassword;
        if (!passwordsMatch) throw new Error("Invalid credentials");

        try {
            await encryptJWT(loggedInUser);
        } catch {
            throw new Error("Failed to log in");
        }
        revalidateTag(GlobalConstants.USER);
    } catch (error) {
        throw new Error(error.message);
    }
    serverRedirect([GlobalConstants.HOME]);
};

const getEncryptionKey = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export const encryptJWT = async (
    loggedInUser: Prisma.UserGetPayload<{ include: { userMembership: true } }>,
) => {
    const expiresAt = dayjs().add(1, "d").toDate();
    // Encode the user ID as jwt
    const jwt = await new SignJWT(loggedInUser)
        .setProtectedHeader({
            alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(getEncryptionKey());
    const cookieStore = await cookies();
    cookieStore.set(GlobalConstants.USER, jwt, {
        secure: true,
        expires: expiresAt,
    });
};

export const getUserCookie = async (): Promise<string | null> => {
    try {
        const cookieStore = await cookies();
        return cookieStore.get(GlobalConstants.USER)?.value;
    } catch {
        return null;
    }
};

export const decryptJWT = async (
    userCookie: string,
): Promise<Prisma.UserGetPayload<{
    include: { userMembership: true };
}> | null> => {
    try {
        const result = await jwtVerify(userCookie, getEncryptionKey(), {
            algorithms: ["HS256"],
        });
        const jwtPayload = result?.payload as Prisma.UserGetPayload<{
            include: { userMembership: true };
        }>;
        // The user is authenticated. Current database state still unclear
        return jwtPayload;
    } catch {
        // Nonexistent or corrupted JWT
        return null;
    }
};

export const deleteUserCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.delete(GlobalConstants.USER);
};

export const logout = async () => {
    try {
        await deleteUserCookie();
    } catch {
        throw new Error("Failed to log out");
    }
    serverRedirect([GlobalConstants.HOME]);
};
