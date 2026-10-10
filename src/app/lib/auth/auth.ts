import NextAuth from "next-auth";
import type { Session, User } from "next-auth";
import type { JWT } from "@auth/core/jwt";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../../prisma/prisma-client";
import { sendMail } from "../mail-service/mail-service";
import "./auth-types";
import { createElement } from "react";
import SignInEmailTemplate from "../mail-service/mail-templates/SignInEmailTemplate";
import { DevicePairingStatus, UserRole, UserStatus } from "../../../prisma/generated/enums";

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
        Credentials({
            id: "device-pairing",
            name: "Device pairing",
            credentials: { code: { label: "Code", type: "text" } },
            authorize: async (credentials) => {
                const code = credentials?.code;
                if (typeof code !== "string" || !code) return null;

                // Atomically claim the request: only succeeds once, for a request
                // that was already approved on another device and hasn't expired.
                const claimed = await prisma.devicePairingRequest.updateMany({
                    where: {
                        device_code: code,
                        status: DevicePairingStatus.confirmed,
                        expires_at: { gt: new Date() },
                        consumed_at: null,
                    },
                    data: { consumed_at: new Date() },
                });
                if (claimed.count !== 1) return null;

                const pairingRequest = await prisma.devicePairingRequest.findUnique({
                    where: { device_code: code },
                    select: { user_id: true },
                });
                if (!pairingRequest?.user_id) return null;

                return prisma.user.findUnique({
                    where: { id: pairingRequest.user_id },
                    select: { id: true, status: true, role: true, user_membership: true },
                });
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: User | null }) {
            // Hydrate token once at login. For subsequent requests, keep token as-is
            // to avoid repeated database reads.
            if (!user?.id) return token;

            token.id = user.id;
            token.status = user.status;
            token.role = user.role;
            token.user_membership = user.user_membership;

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
