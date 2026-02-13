import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import type { TransactionClient } from "../../test/types/test-types";
import GlobalConstants from "../GlobalConstants";
import { Language, UserRole, UserStatus } from "@/prisma/generated/client";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import * as userActions from "./user-actions";
import { auth, signIn, signOut } from "./auth/auth";
import { sendMail } from "./mail-service/mail-service";
import { getOrganizationSettings } from "./organization-settings-actions";
import { getMembershipProduct, renewUserMembership } from "./user-membership-actions";
import { buildFormData } from "../../test/test-helpers";

vi.mock("next/headers", () => ({
    cookies: vi.fn(),
}));

vi.mock("./mail-service/mail-service", () => ({
    sendMail: vi.fn(),
}));

vi.mock("./auth/auth", () => ({
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock("./organization-settings-actions", () => ({
    getOrganizationSettings: vi.fn(),
}));

vi.mock("./user-membership-actions", () => ({
    getMembershipProduct: vi.fn(),
    renewUserMembership: vi.fn(),
}));

describe("user-actions", () => {
    describe("createUser", () => {
        it("creates the first user as validated admin and renews membership", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.user.create).mockResolvedValue({ id: "user-1" } as any);
            vi.mocked(tx.user.update).mockResolvedValue({ id: "user-1" } as any);

            vi.mocked(mockContext.prisma.user.count).mockResolvedValue(0);
            vi.mocked(getMembershipProduct).mockResolvedValue({
                id: "membership-1",
                price: 0,
            } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                email: "first@example.com",
                nickname: "first",
                skill_badges: "badge-1,badge-2",
            });

            await userActions.createUser(formData);

            expect(tx.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    email: "first@example.com",
                    nickname: "first",
                    skill_badges: {
                        createMany: {
                            data: [{ skill_badge_id: "badge-1" }, { skill_badge_id: "badge-2" }],
                        },
                    },
                }),
            });
            expect(tx.user.update).toHaveBeenCalledWith({
                where: { id: "user-1" },
                data: {
                    status: UserStatus.validated,
                    role: UserRole.admin,
                },
            });
            expect(vi.mocked(renewUserMembership)).toHaveBeenCalledWith(
                tx,
                "user-1",
                "membership-1",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
        });

        it("creates a non-first user without admin role", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.user.create).mockResolvedValue({ id: "user-2" } as any);

            vi.mocked(mockContext.prisma.user.count).mockResolvedValue(2);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                email: "member@example.com",
                nickname: "member",
            });

            await userActions.createUser(formData);

            expect(tx.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    email: "member@example.com",
                    nickname: "member",
                }),
            });
            expect(tx.user.update).not.toHaveBeenCalled();
            expect(vi.mocked(renewUserMembership)).not.toHaveBeenCalled();
        });

        it("rejects invalid input", async () => {
            const formData = buildFormData({ email: "not-an-email" });

            await expect(userActions.createUser(formData)).rejects.toThrow();
        });
    });

    describe("submitMemberApplication", () => {
        it("requires application prompt when organization setting is set", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                member_application_prompt: "Tell us more",
            } as any);

            const formData = buildFormData({ email: "apply@example.com" });

            await expect(userActions.submitMemberApplication(formData)).rejects.toThrow(
                "Application message required but not provided.",
            );
            expect(vi.mocked(signIn)).not.toHaveBeenCalled();
        });

        it("creates user, signs in, sends mail, and revalidates", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                member_application_prompt: null,
            } as any);

            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(mockContext.prisma.user.count).mockResolvedValue(1);
            vi.mocked(tx.user.create).mockResolvedValue({ id: "user-1" } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                email: "apply@example.com",
                member_application_prompt: "I want to join",
            });

            await userActions.submitMemberApplication(formData);

            expect(tx.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    email: "apply@example.com",
                }),
            });
            expect(vi.mocked(signIn)).toHaveBeenCalledWith("email", {
                email: "apply@example.com",
                redirect: false,
                callback: "/apply",
                redirectTo: "/profile",
            });
            expect(vi.mocked(sendMail)).toHaveBeenCalledWith(
                [process.env.EMAIL as string],
                "New membership application received",
                expect.anything(),
                "apply@example.com",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
        });

        it("swallows mail errors and still revalidates", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                member_application_prompt: null,
            } as any);
            vi.spyOn(userActions, "createUser").mockResolvedValue();
            vi.mocked(sendMail).mockRejectedValueOnce(new Error("smtp down"));
            const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

            const formData = buildFormData({
                email: "apply@example.com",
                member_application_prompt: "hello",
            });

            await expect(userActions.submitMemberApplication(formData)).resolves.toBeUndefined();

            expect(errorSpy).toHaveBeenCalled();
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
            errorSpy.mockRestore();
        });
    });

    describe("getUserLanguage", () => {
        it("returns language from cookie when valid", async () => {
            vi.mocked(cookies).mockResolvedValue({
                get: vi.fn().mockReturnValue({ value: Language.swedish }),
            } as any);

            const result = await userActions.getUserLanguage();

            expect(result).toBe(Language.swedish);
        });

        it("defaults to english when cookie is missing or invalid", async () => {
            vi.mocked(cookies).mockResolvedValue({
                get: vi.fn().mockReturnValue({ value: "klingon" }),
            } as any);

            const result = await userActions.getUserLanguage();

            expect(result).toBe(Language.english);
        });
    });

    describe("updateUser", () => {
        const userId = "550e8400-e29b-41d4-a716-446655440000";

        it("updates user and replaces skill badges", async () => {
            const tx = mockContext.prisma as any as TransactionClient;

            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                email: "updated@example.com",
                skill_badges: "badge-1,badge-2",
            });

            await userActions.updateUser(userId, formData);

            expect(tx.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { email: "updated@example.com" },
            });
            expect(tx.userSkillBadge.deleteMany).toHaveBeenCalledWith({
                where: { user_id: userId },
            });
            expect(tx.userSkillBadge.createMany).toHaveBeenCalledWith({
                data: [
                    { user_id: userId, skill_badge_id: "badge-1" },
                    { user_id: userId, skill_badge_id: "badge-2" },
                ],
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
        });

        it("skips skill badge updates when none are provided", async () => {
            const tx = mockContext.prisma as any as TransactionClient;

            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({ email: "updated@example.com" });

            await userActions.updateUser(userId, formData);

            expect(tx.userSkillBadge.deleteMany).not.toHaveBeenCalled();
            expect(tx.userSkillBadge.createMany).not.toHaveBeenCalled();
        });

        it("rejects invalid user id", async () => {
            const formData = buildFormData({ email: "updated@example.com" });

            await expect(userActions.updateUser("not-a-uuid", formData)).rejects.toThrow();
        });
    });

    describe("deleteUser", () => {
        const userId = "550e8400-e29b-41d4-a716-446655440000";

        it("prevents deleting the last admin", async () => {
            mockContext.prisma.user.findMany.mockResolvedValue([
                { id: userId, role: UserRole.admin },
            ] as any);

            await expect(userActions.deleteUser(userId)).rejects.toThrow(
                "You are the last admin standing. Find an heir before leaving.",
            );
        });

        it("allows deleting a non-admin when there is only one admin", async () => {
            const adminId = "admin-id-12345-67890";
            mockContext.prisma.user.findMany.mockResolvedValue([
                { id: adminId, role: UserRole.admin },
            ] as any);
            mockContext.prisma.user.delete.mockResolvedValue({ id: userId } as any);
            vi.mocked(mockContext.prisma.$transaction).mockResolvedValue(undefined);

            await userActions.deleteUser(userId);

            expect(mockContext.prisma.user.delete).toHaveBeenCalledWith({
                where: { id: userId },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
        });

        it("deletes user and revalidates related tags", async () => {
            mockContext.prisma.user.findMany.mockResolvedValue([
                { id: userId, role: UserRole.admin },
                { id: "other", role: UserRole.admin },
            ] as any);
            mockContext.prisma.user.delete.mockResolvedValue({ id: userId } as any);
            vi.mocked(mockContext.prisma.$transaction).mockResolvedValue(undefined);

            await userActions.deleteUser(userId);

            expect(mockContext.prisma.user.delete).toHaveBeenCalledWith({
                where: { id: userId },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.USER_MEMBERSHIP,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.PARTICIPANT_USERS,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.EVENT, "max");
        });

        it("rejects invalid user id", async () => {
            await expect(userActions.deleteUser("not-a-uuid")).rejects.toThrow();
        });
    });

    describe("getActiveMembers", () => {
        it("returns active members with select fields", async () => {
            const activeMembers = [{ id: "user-1", nickname: "A", skill_badges: [] }] as any;
            mockContext.prisma.user.findMany.mockResolvedValue(activeMembers);

            const result = await userActions.getActiveMembers();

            expect(mockContext.prisma.user.findMany).toHaveBeenCalled();
            expect(result).toEqual(activeMembers);
        });
    });

    describe("getLoggedInUser", () => {
        it("returns null when auth has no user", async () => {
            vi.mocked(auth).mockResolvedValue(null as any);

            const result = await userActions.getLoggedInUser();

            expect(result).toBeNull();
            expect(mockContext.prisma.user.findUnique).not.toHaveBeenCalled();
        });

        it("returns the logged in user with relations", async () => {
            vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
            mockContext.prisma.user.findUnique.mockResolvedValue({ id: "user-1" } as any);

            const result = await userActions.getLoggedInUser();

            expect(mockContext.prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: "user-1" },
                include: { user_membership: true, skill_badges: true },
            });
            expect(result).toEqual({ id: "user-1" });
        });
    });

    describe("login", () => {
        it("signs in existing members", async () => {
            mockContext.prisma.user.findUniqueOrThrow.mockResolvedValue({ id: "user-1" } as any);
            const formData = buildFormData({ email: "member@example.com" });

            await userActions.login(formData);

            expect(mockContext.prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { email: "member@example.com" },
            });
            expect(vi.mocked(signIn)).toHaveBeenCalledWith("email", {
                email: "member@example.com",
                callback: "/login",
                redirectTo: "/",
                redirect: false,
            });
        });

        it("rejects invalid login input", async () => {
            const formData = buildFormData({ email: "not-an-email" });

            await expect(userActions.login(formData)).rejects.toThrow();
            expect(mockContext.prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
        });
    });

    describe("logOut", () => {
        it("signs out with redirect", async () => {
            await userActions.logOut();

            expect(vi.mocked(signOut)).toHaveBeenCalledWith({
                redirectTo: "/",
                redirect: true,
            });
        });
    });

    describe("validateUserMembership", () => {
        const userId = "550e8400-e29b-41d4-a716-446655440000";

        it("updates user status, sends mail, and revalidates", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.user.update).mockResolvedValue({
                id: userId,
                email: "member@example.com",
            } as any);

            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await userActions.validateUserMembership(userId);

            expect(tx.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { status: UserStatus.validated },
            });
            expect(vi.mocked(sendMail)).toHaveBeenCalledWith(
                ["member@example.com"],
                "Your membership has been validated",
                expect.anything(),
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
        });

        it("rejects invalid user id", async () => {
            await expect(userActions.validateUserMembership("not-a-uuid")).rejects.toThrow();
        });
    });
});
