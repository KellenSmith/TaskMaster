import { describe, expect, it, vi } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import type { TransactionClient } from "../../test/types/test-types";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import { signIn, signOut } from "./auth/auth";
import { sendMail } from "./mail-service/mail-service";
import { getOrganizationSettings } from "./organization-settings-helpers";
import { getMembershipProduct, renewUserMembership } from "./user-membership-helpers";
import { buildFormData } from "../../test/test-helpers";
import { prisma } from "../../prisma/prisma-client";
import { Language, UserRole, UserStatus } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/client";
import { prismaErrorCodes } from "../../prisma/prisma-error-codes";

vi.mock("./user-helpers", () => ({
    getUserLanguage: vi.fn(),
}));
import * as userActions from "./user-actions";
import { getUserLanguage } from "./user-helpers";

vi.mock("./mail-service/mail-service", () => ({
    sendMail: vi.fn(),
}));
vi.mock("./auth/auth", () => ({
    signIn: vi.fn(),
    signOut: vi.fn(),
}));
vi.mock("./organization-settings-helpers", () => ({
    getOrganizationSettings: vi.fn(),
}));
vi.mock("./user-membership-helpers", () => ({
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
            vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                member_application_prompt: "Tell us more",
            } as any);

            const formData = buildFormData({ email: "apply@example.com" });

            const errorMsg = await userActions.submitMemberApplication(formData);

            expect(errorMsg).toBe("Motivation required.");

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

        it("logs in existing user and returns undefined when email already exists", async () => {
            vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                member_application_prompt: null,
            } as any);
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(mockContext.prisma.user.count).mockResolvedValue(1);

            const duplicateEmailError = new Prisma.PrismaClientKnownRequestError(
                "Unique constraint failed",
                {
                    code: prismaErrorCodes.uniqueConstraintViolation,
                    clientVersion: "7.4.2",
                },
            );
            (duplicateEmailError as any).meta = {
                driverAdapterError: {
                    cause: {
                        constraint: { fields: [GlobalConstants.EMAIL] },
                    },
                },
            };
            vi.mocked(tx.user.create).mockRejectedValue(duplicateEmailError);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );
            vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
                id: "user-1",
                email: "apply@example.com",
                user_membership: {
                    id: "membership-1",
                    user_id: "user-1",
                    membership_id: "membership-basic",
                },
            } as any);

            const formData = buildFormData({
                email: "apply@example.com",
                member_application_prompt: "I want to join",
            });

            await expect(userActions.submitMemberApplication(formData)).resolves.toBeUndefined();

            expect(vi.mocked(signIn)).toHaveBeenCalledWith("email", {
                email: "apply@example.com",
                callback: "/login",
                redirectTo: "/",
                redirect: false,
            });
            expect(vi.mocked(sendMail)).not.toHaveBeenCalled();
        });

        it("returns nickname conflict message when nickname already exists", async () => {
            vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                member_application_prompt: null,
            } as any);
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(mockContext.prisma.user.count).mockResolvedValue(1);

            const duplicateNicknameError = new Prisma.PrismaClientKnownRequestError(
                "Unique constraint failed",
                {
                    code: prismaErrorCodes.uniqueConstraintViolation,
                    clientVersion: "7.4.2",
                },
            );
            (duplicateNicknameError as any).meta = {
                driverAdapterError: {
                    cause: {
                        constraint: { fields: [GlobalConstants.NICKNAME] },
                    },
                },
            };
            vi.mocked(tx.user.create).mockRejectedValue(duplicateNicknameError);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                email: "apply@example.com",
                nickname: "taken-name",
                member_application_prompt: "I want to join",
            });

            const result = await userActions.submitMemberApplication(formData);

            expect(result).toBe("A user with this nickname already exists.");
            expect(vi.mocked(signIn)).not.toHaveBeenCalled();
            expect(vi.mocked(sendMail)).not.toHaveBeenCalled();
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

    describe("login", () => {
        it("signs in existing members", async () => {
            vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
                id: "user-1",
                email: "member@example.com",
                user_membership: {
                    id: "membership-1",
                    user_id: "user-1",
                    membership_id: "membership-basic",
                },
            } as any);
            const formData = buildFormData({ email: "member@example.com" });

            await userActions.login(formData);

            expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { email: "member@example.com" },
                include: { user_membership: true },
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
            expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
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
