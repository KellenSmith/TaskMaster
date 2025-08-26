// TODO: migrate to using passwordless email login
// TODO: migrate to using prisma adapter
import NextAuth, { CredentialsSignin, Session, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { Prisma } from "@prisma/client";
import GlobalConstants from "../GlobalConstants";
import { JWT } from "@auth/core/jwt";
import { prisma } from "../../../prisma/prisma-client";

export const failedSigninCodes = {
    MEMBERSHIP_PENDING: "Membership application pending",
    INVALID_CREDENTIALS: "Invalid credentials",
    USER_NOT_FOUND: "Please apply for membership",
};

declare module "next-auth" {
    /**
     * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    // eslint-disable-next-line no-unused-vars
    interface Session {
        user: Prisma.UserGetPayload<{ include: { userMembership: true } }> & DefaultSession["user"];
    }
}

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

const throwFailedSignInError = (errorCode: string) => {
    const error = new CredentialsSignin();
    error.code = errorCode;
    throw error;
};

const authorize = async (
    credentials: Partial<Record<"email" | "password", unknown>>,
): Promise<Prisma.UserGetPayload<{ include: { userMembership: true } }>> => {
    // Everyone who applied for membership exists in the database
    const loggedInUser = await prisma.user.findUnique({
        where: {
            email: credentials.email as string,
        },
        include: {
            userCredentials: true,
            userMembership: true,
        },
    });
    if (!loggedInUser) throwFailedSignInError(failedSigninCodes.USER_NOT_FOUND);
    if (!loggedInUser.userCredentials) throwFailedSignInError(failedSigninCodes.MEMBERSHIP_PENDING);

    // All validated members have credentials
    const userCredentials = await prisma.userCredentials.findUnique({
        where: {
            userId: loggedInUser.id,
        } as any as Prisma.UserCredentialsWhereUniqueInput,
    });
    if (!userCredentials) throwFailedSignInError(failedSigninCodes.INVALID_CREDENTIALS);

    // Match hashed password to stored hashed password
    const hashedPassword = await hashPassword(
        credentials.password as string,
        userCredentials[GlobalConstants.SALT],
    );
    const passwordsMatch = hashedPassword === userCredentials.hashedPassword;
    if (!passwordsMatch) throwFailedSignInError(failedSigninCodes.INVALID_CREDENTIALS);

    // eslint-disable-next-line no-unused-vars
    const { userCredentials: userCredentialsToOmit, ...userWithMembership } = loggedInUser;
    return userWithMembership;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: {
                    type: "email",
                    label: "Email",
                    placeholder: "johndoe@gmail.com",
                },
                password: {
                    type: "password",
                    label: "Password",
                    placeholder: "*****",
                },
            },
            authorize,
        }),
    ],

    callbacks: {
        // Persist the full user object into the JWT on sign in
        jwt: async ({
            token,
            user,
        }: {
            token: JWT;
            user: Prisma.UserGetPayload<{ include: { userMembership: true } }> | undefined;
        }) => {
            // On initial sign in `user` is available — persist it into the token.
            if (user) return { ...token, user };
            return token;
        },
        // Populate session.user from the token (including the full user object).
        // This ensures `useSession().data.user` contains the full user returned by `authorize()`.
        session: ({ session, token }): Session => ({
            ...session,
            user:
                (token.user as Prisma.UserGetPayload<{ include: { userMembership: true } }>) ||
                session.user,
        }),
    },
});
