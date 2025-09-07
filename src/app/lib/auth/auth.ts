import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../../../prisma/prisma-client";
import { sendSignInEmail } from "../mail-service/mail-service";
import "./auth-types";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        {
            id: "email",
            type: "email",
            name: "Email",
            server: "", // Not used since we handle sending ourselves
            from: process.env.EMAIL,
            sendVerificationRequest: async ({ identifier: email, url }) => {
                try {
                    await sendSignInEmail(email, url);
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
                token.id = user.id;
                token.status = user.status;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            // Add the user id from the token to the session
            if (token.id) {
                session.user.id = token.id as string;
            }
            if (token.status) {
                session.user.status = token.status;
            }
            if (token.role) {
                session.user.role = token.role;
            }
            return session;
        },
    },
    // TODO: Configure branded page for invalid sign in link
});
