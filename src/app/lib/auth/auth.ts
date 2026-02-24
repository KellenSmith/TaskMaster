import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../../prisma/prisma-client";
import { sendMail } from "../mail-service/mail-service";
import "./auth-types";
import { createElement } from "react";
import SignInEmailTemplate from "../mail-service/mail-templates/SignInEmailTemplate";
import { UserRole, UserStatus } from "../../../prisma/generated/enums";

const EMAIL_FROM = process.env.EMAIL;
if (!EMAIL_FROM) {
    throw new Error("EMAIL is not set");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        {
            id: "email",
            type: "email",
            name: "Email",
            server: "", // Not used since we handle sending ourselves
            from: process.env.EMAIL as string,
            sendVerificationRequest: async ({ identifier: email, url }) => {
                try {
                    const mailContent = createElement(SignInEmailTemplate, {
                        email,
                        url,
                    });
                    await sendMail(
                        [email],
                        `Sign in to ${process.env.NEXT_PUBLIC_ORG_NAME as string}`,
                        mailContent,
                    );
                } catch (error) {
                    console.error("Failed to send sign-in email:", error);
                    throw new Error("Failed to send verification email");
                }
            },
        },
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            // If user object is available (first time after sign in), add the user id to the token
            if (user) {
                if (user.id) {
                    token.id = user.id;
                }

                token.status = user.status;
                token.role = user.role;
                // Always fetch user_membership from Prisma at sign-in
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { user_membership: true },
                });
                token.user_membership = dbUser?.user_membership ?? null;
            }
            return token;
        },
        async session({ session, token }) {
            // Add the user id from the token to the session

            if (token.id) {
                session.user.id = token.id as string;
                // Always fetch user_membership from Prisma at sign-in
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id },
                    select: { user_membership: true },
                });
                session.user.status = token.status as UserStatus;
                session.user.role = token.role as UserRole;
                session.user.user_membership = dbUser?.user_membership ?? null;
            }
            return session;
        },
    },
    // TODO: Configure branded page for invalid sign in link
});
