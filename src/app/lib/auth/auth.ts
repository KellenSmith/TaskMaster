import NextAuth from "next-auth";
import type { Session, User } from "next-auth";
import type { JWT } from "@auth/core/jwt";
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
            sendVerificationRequest: async ({
                identifier: email,
                url,
            }: {
                identifier: string;
                url: string;
            }) => {
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
                    throw new Error("Failed to send verification email", { cause: error });
                }
            },
        },
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: User | null }) {
            // Hydrate token once at login. For subsequent requests, keep token as-is
            // to avoid repeated database reads.
            if (!user?.id) return token;

            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { id: true, status: true, role: true, user_membership: true },
            });
            if (!dbUser) return token;

            token.id = dbUser.id;
            token.status = dbUser.status;
            token.role = dbUser.role;
            token.user_membership = dbUser.user_membership;

            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            // Build session from token only to avoid per-request DB operations.
            if (!token.id || !token.status || !token.role) return session;

            session.user.id = token.id;
            session.user.status = token.status as UserStatus;
            session.user.role = token.role as UserRole;
            session.user.user_membership = token.user_membership ?? null;

            return session;
        },
    },
    // TODO: Configure branded page for invalid sign in link
});
