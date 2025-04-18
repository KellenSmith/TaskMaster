"use server";

import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import GlobalConstants from "../../GlobalConstants";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import dayjs from "dayjs";
import { FormActionState } from "../../ui/form/Form";
import { LoginSchema } from "../definitions";

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
    const hashedPassword = await hashPassword(password, salt);
    const newUserCredentials = {
        [GlobalConstants.SALT]: salt,
        [GlobalConstants.HASHED_PASSWORD]: hashedPassword,
    } as Prisma.UserCredentialsCreateWithoutUserInput;
    return newUserCredentials;
};

export const createSession = async (fieldValues: LoginSchema) => {
    const loggedInUser = await getUserByUniqueKey(
        GlobalConstants.EMAIL,
        fieldValues.email as string,
    );

    await encryptJWT(loggedInUser);
};

export const login = async (
    currentActionState: FormActionState,
    fieldValues: LoginSchema,
): Promise<FormActionState> => {
    const authState = { ...currentActionState };

    const loggedInUser = await getUserByUniqueKey(GlobalConstants.EMAIL, fieldValues.email);

    if (!loggedInUser) {
        authState.status = 404;
        authState.errorMsg = "Please apply for membership";
        authState.result = "";
        return authState;
    }

    const userCredentials = await prisma.userCredentials.findUnique({
        where: {
            email: fieldValues.email,
        } as any as Prisma.UserCredentialsWhereUniqueInput,
    });
    if (!userCredentials) {
        authState.status = 403;
        authState.errorMsg = "Membership pending";
        authState.result = "";
        return authState;
    }

    const hashedPassword = await hashPassword(
        fieldValues.password as string,
        userCredentials[GlobalConstants.SALT],
    );
    const passwordsMatch = hashedPassword === userCredentials.hashedPassword;
    if (!passwordsMatch) {
        authState.status = 401;
        authState.errorMsg = "Invalid credentials";
        authState.result = "";
        return authState;
    }
    authState.status = 200;
    authState.result = JSON.stringify(loggedInUser);
    authState.errorMsg = "";
    await createSession(fieldValues);
    return authState;
};

const getEncryptionKey = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export const encryptJWT = async (loggedInUser: Prisma.UserWhereUniqueInput) => {
    const expiresAt = dayjs().add(parseInt(process.env.COOKIE_LIFESPAN), "d").toDate();
    // Encode the user ID as jwt
    const jwt = await new SignJWT(loggedInUser)
        .setProtectedHeader({
            alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(getEncryptionKey());
    const cookieStore = await cookies();
    cookieStore.set(GlobalConstants.USER_CREDENTIALS, jwt, {
        httpOnly: true,
        secure: true,
        expires: expiresAt,
    });
};

export const getUserByUniqueKey = async (
    key: string,
    value: string,
): Promise<Prisma.UserWhereUniqueInput | null> => {
    const userFilterParams = {
        [key]: value,
    } as unknown;
    const loggedInUser = await prisma.user.findUnique({
        where: userFilterParams as Prisma.UserWhereUniqueInput,
    });
    return loggedInUser;
};

export const decryptJWT = async (): Promise<JWTPayload> | undefined => {
    try {
        const cookieStore = await cookies();
        const cookie = cookieStore.get(GlobalConstants.USER_CREDENTIALS)?.value;
        const result = await jwtVerify(cookie, getEncryptionKey(), {
            algorithms: ["HS256"],
        });
        const jwtPayload = result?.payload;
        return jwtPayload;
    } catch {
        return null;
    }
};

export const deleteUserCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.delete(GlobalConstants.USER_CREDENTIALS);
};
