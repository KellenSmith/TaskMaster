import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import { mockContext } from "../../test/mocks/prismaMock";
import GlobalConstants from "../GlobalConstants";
import { buildFormData } from "../../test/test-helpers";
import * as skillBadgeActions from "./skill-badge-actions";
import { deleteOldBlob } from "./organization-settings-actions";
import { sanitizeFormData } from "./html-sanitizer";

vi.mock("./organization-settings-actions", () => ({
    deleteOldBlob: vi.fn(),
}));

vi.mock("./html-sanitizer", () => ({
    sanitizeFormData: vi.fn(),
}));

describe("skill-badge-actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createSkillBadge", () => {
        it("creates a skill badge and revalidates", async () => {
            const sanitized = {
                name: "First Aid",
                description: "<p>Certified</p>",
                image_url: "https://example.com/badge.png",
            };
            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.skillBadge.create.mockResolvedValue({ id: "badge-1" } as any);

            const formData = buildFormData({
                name: "First Aid",
                description: "<p>Certified</p>",
                image_url: "https://example.com/badge.png",
            });

            await skillBadgeActions.createSkillBadge(formData);

            expect(vi.mocked(sanitizeFormData)).toHaveBeenCalledWith({
                name: "First Aid",
                description: "<p>Certified</p>",
                image_url: "https://example.com/badge.png",
            });
            expect(mockContext.prisma.skillBadge.create).toHaveBeenCalledWith({
                data: sanitized,
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.SKILL_BADGES,
                "max",
            );
        });

        it("rejects invalid input", async () => {
            const formData = buildFormData({});

            await expect(skillBadgeActions.createSkillBadge(formData)).rejects.toThrow();
        });
    });

    describe("updateSkillBadge", () => {
        it("updates a skill badge, deletes old blob, and revalidates", async () => {
            const sanitized = {
                name: "Updated",
                description: "<p>Updated</p>",
                image_url: "https://blob.vercel-storage.com/new.png",
            };
            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.skillBadge.findUniqueOrThrow.mockResolvedValue({
                id: "badge-1",
                image_url: "https://blob.vercel-storage.com/old.png",
            } as any);

            const formData = buildFormData({
                name: "Updated",
                description: "<p>Updated</p>",
                image_url: "https://blob.vercel-storage.com/new.png",
            });

            await skillBadgeActions.updateSkillBadge(
                "550e8400-e29b-41d4-a716-446655440000",
                formData,
            );

            expect(mockContext.prisma.skillBadge.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: "550e8400-e29b-41d4-a716-446655440000" },
            });
            expect(vi.mocked(deleteOldBlob)).toHaveBeenCalledWith(
                "https://blob.vercel-storage.com/old.png",
                "https://blob.vercel-storage.com/new.png",
            );
            expect(mockContext.prisma.skillBadge.update).toHaveBeenCalledWith({
                where: { id: "550e8400-e29b-41d4-a716-446655440000" },
                data: sanitized,
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.SKILL_BADGES,
                "max",
            );
        });

        it("updates without deleting blob when no previous image", async () => {
            const sanitized = {
                name: "Updated",
                description: "<p>Updated</p>",
                image_url: null,
            };
            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.skillBadge.findUniqueOrThrow.mockResolvedValue({
                id: "badge-1",
                image_url: null,
            } as any);

            const formData = buildFormData({
                name: "Updated",
                description: "<p>Updated</p>",
            });

            await skillBadgeActions.updateSkillBadge(
                "550e8400-e29b-41d4-a716-446655440000",
                formData,
            );

            expect(vi.mocked(deleteOldBlob)).not.toHaveBeenCalled();
        });

        it("rejects invalid skill badge id", async () => {
            const formData = buildFormData({ name: "Bad" });

            await expect(
                skillBadgeActions.updateSkillBadge("not-a-uuid", formData),
            ).rejects.toThrow();
        });
    });

    describe("deleteSkillBadge", () => {
        it("deletes a skill badge, deletes blob, and revalidates", async () => {
            mockContext.prisma.skillBadge.delete.mockResolvedValue({
                id: "badge-1",
                image_url: "https://blob.vercel-storage.com/old.png",
            } as any);

            await skillBadgeActions.deleteSkillBadge(
                "550e8400-e29b-41d4-a716-446655440000",
            );

            expect(mockContext.prisma.skillBadge.delete).toHaveBeenCalledWith({
                where: { id: "550e8400-e29b-41d4-a716-446655440000" },
            });
            expect(vi.mocked(deleteOldBlob)).toHaveBeenCalledWith(
                "https://blob.vercel-storage.com/old.png",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.SKILL_BADGES,
                "max",
            );
        });

        it("deletes a skill badge without deleting blob when none exists", async () => {
            mockContext.prisma.skillBadge.delete.mockResolvedValue({
                id: "badge-1",
                image_url: null,
            } as any);

            await skillBadgeActions.deleteSkillBadge(
                "550e8400-e29b-41d4-a716-446655440000",
            );

            expect(vi.mocked(deleteOldBlob)).not.toHaveBeenCalled();
        });

        it("rejects invalid skill badge id", async () => {
            await expect(skillBadgeActions.deleteSkillBadge("not-a-uuid")).rejects.toThrow();
        });
    });
});
