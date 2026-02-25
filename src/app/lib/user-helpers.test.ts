import { describe, expect, it, vi } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import { cookies } from "next/headers";
import * as userActions from "./user-helpers";
import { auth } from "./auth/auth";
import { Language } from "../../prisma/generated/enums";

vi.mock("next/headers", () => ({
    cookies: vi.fn(),
}));

vi.mock("./auth/auth", () => ({
    auth: vi.fn(),
}));

describe("user-actions", () => {
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

    describe("getActiveMembers", () => {
        it("returns active members with select fields", async () => {
            const activeMembers = [{ id: "user-1", nickname: "A", skill_badges: [] }] as any;
            mockContext.prisma.user.findMany.mockResolvedValue(activeMembers);

            const result = await userActions.getActiveMembers();

            expect(mockContext.prisma.user.findMany).toHaveBeenCalled();
            expect(result).toEqual(activeMembers);
        });
    });
});
