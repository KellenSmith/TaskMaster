import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole, UserStatus } from "@prisma/client";
import type { Session, User } from "next-auth";
import type { JWT } from "@auth/core/jwt";
import dayjs from "dayjs";

type NextAuthOptions = {
    session: { strategy: string };
    providers: Array<{
        // eslint-disable-next-line no-unused-vars
        sendVerificationRequest: (args: { identifier: string; url: string }) => Promise<void>;
    }>;
    callbacks: {
        // eslint-disable-next-line no-unused-vars
        jwt: (params: { token: JWT; user?: User | null }) => Promise<JWT>;
        // eslint-disable-next-line no-unused-vars
        session: (params: { session: Session; token: JWT }) => Promise<Session>;
    };
};

let nextAuthOptions: NextAuthOptions | undefined;

vi.mock("next-auth", () => ({
    default: vi.fn((options: NextAuthOptions) => {
        nextAuthOptions = options;
        return {
            handlers: {},
            auth: {},
            signIn: vi.fn(),
            signOut: vi.fn(),
        };
    }),
}));

vi.mock("@auth/prisma-adapter", () => ({
    PrismaAdapter: vi.fn(() => ({ adapter: "prisma" })),
}));

vi.mock("../../../../prisma/prisma-client", () => ({
    prisma: {},
}));

const sendMailMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../mail-service/mail-service", () => ({
    sendMail: sendMailMock,
}));

describe("auth.ts", () => {

    beforeEach(() => {
        nextAuthOptions = undefined;
        sendMailMock.mockClear();
    });

    const loadAuthModule = async (): Promise<NextAuthOptions> => {
        vi.resetModules();
        await import("./auth");
        if (!nextAuthOptions) {
            throw new Error("NextAuth options not initialized");
        }
        return nextAuthOptions;
    };

    it("throws when EMAIL is not set", async () => {
        delete process.env.EMAIL;
        await expect(import("./auth")).rejects.toThrowError(/EMAIL is not set/);
    });

    it("configures session strategy as jwt", async () => {
        process.env.EMAIL = "test@example.com";
        const options = await loadAuthModule();
        expect(options.session.strategy).toBe("jwt");
    });

    it("sends verification email with SignInEmailTemplate", async () => {
        process.env.EMAIL = "test@example.com";
        process.env.NEXT_PUBLIC_ORG_NAME = "TaskMaster";
        const options = await loadAuthModule();

        const sendVerificationRequest = options.providers[0].sendVerificationRequest;
        await sendVerificationRequest({
            identifier: "user@example.com",
            url: "https://example.com/signin",
        });

        expect(sendMailMock).toHaveBeenCalledTimes(1);
        const [recipients, subject, content] = sendMailMock.mock.calls[0];
        expect(recipients).toEqual(["user@example.com"]);
        expect(subject).toBe("Sign in to TaskMaster");
        expect(content?.type?.name).toBe("SignInEmailTemplate");
        expect(content?.props).toMatchObject({
            email: "user@example.com",
            url: "https://example.com/signin",
        });
    });

    it("throws a friendly error when email sending fails", async () => {
        process.env.EMAIL = "test@example.com";
        const options = await loadAuthModule();

        sendMailMock.mockRejectedValueOnce(new Error("boom"));
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const sendVerificationRequest = options.providers[0].sendVerificationRequest;

        await expect(
            sendVerificationRequest({ identifier: "user@example.com", url: "url" }),
        ).rejects.toThrowError("Failed to send verification email");

        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it("jwt callback adds user fields to the token", async () => {
        process.env.EMAIL = "test@example.com";
        const options = await loadAuthModule();

        const token: JWT = {} as JWT;
        const user: User = {
            id: "user-1",
            status: UserStatus.validated,
            role: UserRole.admin,
            user_membership: {
                id: "membership-1",
                user_id: "user-1",
                membership_id: "membership-basic",
                expires_at: dayjs.utc().add(1, "month").toDate(),
                subscription_token: null,
                payeeRef: null,
            },
        } as User;

        const result = await options.callbacks.jwt({ token, user });

        expect(result).toStrictEqual(user);
    });

    it("jwt callback leaves token untouched when no user provided", async () => {
        process.env.EMAIL = "test@example.com";
        const options = await loadAuthModule();

        const token = { existing: "value" } as JWT & { existing: string };
        const result = await options.callbacks.jwt({ token, user: null });

        expect(result).toEqual({ existing: "value" });
    });

    it("session callback maps token fields onto session.user", async () => {
        process.env.EMAIL = "test@example.com";
        const options = await loadAuthModule();

        const session = { user: {} } as Session;
        const token: JWT = {
            id: "user-1",
            status: UserStatus.validated,
            role: UserRole.member,
            user_membership: {
                id: "membership-1",
                user_id: "user-1",
                membership_id: "membership-basic",
                expires_at: dayjs.utc().add(1, "month").toDate(),
                subscription_token: null,
                payeeRef: null,
            },
        } as JWT;

        const result = await options.callbacks.session({ session, token });

        expect(result.user).toEqual(token);
    });
});
