import { describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import type { TransactionClient } from "../../test/types/test-types";
import { buildFormData } from "../../test/test-helpers";
import * as infoPageActions from "./info-page-actions";
import { getLoggedInUser } from "./user-actions";
import { serverRedirect } from "./utils";
import { createTextContent } from "./text-content-actions";
import { Language, UserRole } from "../../prisma/generated/enums";

vi.mock("./user-actions", () => ({
    getLoggedInUser: vi.fn(),
}));

vi.mock("./utils", () => ({
    serverRedirect: vi.fn(),
}));

vi.mock("./text-content-actions", () => ({
    createTextContent: vi.fn(),
}));

const infoPageId = "550e8400-e29b-41d4-a716-446655440000";
const titleTextId = "550e8400-e29b-41d4-a716-446655440001";
const contentTextId = "550e8400-e29b-41d4-a716-446655440002";

describe("info-page-actions", () => {
    describe("createInfoPage", () => {
        it("creates info page with text content and redirects", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const titleContent = { id: titleTextId, translations: [] };
            const contentContent = { id: contentTextId, translations: [] };

            vi.mocked(createTextContent)
                .mockResolvedValueOnce(titleContent as any)
                .mockResolvedValueOnce(contentContent as any);

            vi.mocked(tx.infoPage.create).mockResolvedValue({ id: infoPageId } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                title: "About Us",
                lowest_allowed_user_role: "member",
            });

            await infoPageActions.createInfoPage(formData);

            expect(vi.mocked(createTextContent)).toHaveBeenCalledTimes(2);
            expect(tx.textTranslation.updateMany).toHaveBeenCalledWith({
                where: { text_content_id: titleTextId },
                data: { text: "About Us" },
            });
            expect(tx.infoPage.create).toHaveBeenCalledWith({
                data: {
                    lowest_allowed_user_role: "member",
                    titleText: { connect: { id: titleTextId } },
                    content: { connect: { id: contentTextId } },
                },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.INFO_PAGE, "max");
            expect(vi.mocked(serverRedirect)).toHaveBeenCalledWith([GlobalConstants.INFO_PAGE], {
                [GlobalConstants.INFO_PAGE_ID]: infoPageId,
            });
        });

        it("creates info page with null role when empty string provided", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const titleContent = { id: titleTextId, translations: [] };
            const contentContent = { id: contentTextId, translations: [] };

            vi.mocked(createTextContent)
                .mockResolvedValueOnce(titleContent as any)
                .mockResolvedValueOnce(contentContent as any);

            vi.mocked(tx.infoPage.create).mockResolvedValue({ id: infoPageId } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                title: "Public Page",
                lowest_allowed_user_role: "",
            });

            await infoPageActions.createInfoPage(formData);

            expect(tx.infoPage.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        lowest_allowed_user_role: null,
                    }),
                }),
            );
        });

        it("throws error when creation fails", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(createTextContent).mockResolvedValue({ id: titleTextId } as any);
            vi.mocked(tx.infoPage.create).mockResolvedValue({ id: "" } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                title: "Test",
                lowest_allowed_user_role: "member",
            });

            await expect(infoPageActions.createInfoPage(formData)).rejects.toThrow(
                "Failed to create InfoPage",
            );
        });

        it("rejects invalid input", async () => {
            const formData = buildFormData({});

            await expect(infoPageActions.createInfoPage(formData)).rejects.toThrow();
        });
    });

    describe("updateInfoPage", () => {
        it("updates info page and title translation", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const updatedInfoPage = {
                id: infoPageId,
                titleText: { id: titleTextId },
            };

            vi.mocked(tx.infoPage.update).mockResolvedValue(updatedInfoPage as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                title: "Updated Title",
                lowest_allowed_user_role: "admin",
            });

            await infoPageActions.updateInfoPage(formData, infoPageId, Language.english);

            expect(tx.infoPage.update).toHaveBeenCalledWith({
                where: { id: infoPageId },
                data: { lowest_allowed_user_role: "admin" },
                include: { titleText: true },
            });
            expect(tx.textTranslation.update).toHaveBeenCalledWith({
                where: {
                    language_text_content_id: {
                        language: Language.english,
                        text_content_id: titleTextId,
                    },
                },
                data: { text: "Updated Title" },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.INFO_PAGE, "max");
        });

        it("sets lowest_allowed_user_role to null when empty string provided", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const updatedInfoPage = {
                id: infoPageId,
                titleText: { id: titleTextId },
            };

            vi.mocked(tx.infoPage.update).mockResolvedValue(updatedInfoPage as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                title: "Updated Title",
                lowest_allowed_user_role: "",
            });

            await infoPageActions.updateInfoPage(formData, infoPageId, Language.english);

            expect(tx.infoPage.update).toHaveBeenCalledWith({
                where: { id: infoPageId },
                data: { lowest_allowed_user_role: null },
                include: { titleText: true },
            });
        });

        it("skips title translation update when titleText is null", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const updatedInfoPage = {
                id: infoPageId,
                titleText: null,
            };

            vi.mocked(tx.infoPage.update).mockResolvedValue(updatedInfoPage as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                title: "Updated Title",
                lowest_allowed_user_role: "member",
            });

            await infoPageActions.updateInfoPage(formData, infoPageId, Language.swedish);

            expect(tx.textTranslation.update).not.toHaveBeenCalled();
        });

        it("rejects invalid info page id", async () => {
            const formData = buildFormData({
                title: "Test",
                lowest_allowed_user_role: "member",
            });

            await expect(
                infoPageActions.updateInfoPage(formData, "not-a-uuid", Language.english),
            ).rejects.toThrow();
        });

        it("rejects invalid form data", async () => {
            const formData = buildFormData({});

            await expect(
                infoPageActions.updateInfoPage(formData, infoPageId, Language.english),
            ).rejects.toThrow();
        });
    });

    describe("deleteInfoPage", () => {
        it("deletes info page when user is admin", async () => {
            vi.mocked(getLoggedInUser).mockResolvedValue({
                id: "user-1",
                role: UserRole.admin,
            } as any);
            mockContext.prisma.infoPage.delete.mockResolvedValue({ id: infoPageId } as any);

            await infoPageActions.deleteInfoPage(infoPageId);

            expect(mockContext.prisma.infoPage.delete).toHaveBeenCalledWith({
                where: { id: infoPageId },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.INFO_PAGE, "max");
        });

        it("throws error when user is not admin", async () => {
            vi.mocked(getLoggedInUser).mockResolvedValue({
                id: "user-1",
                role: UserRole.member,
            } as any);

            await expect(infoPageActions.deleteInfoPage(infoPageId)).rejects.toThrow(
                "Unauthorized",
            );
            expect(mockContext.prisma.infoPage.delete).not.toHaveBeenCalled();
        });

        it("throws error when user is not logged in", async () => {
            vi.mocked(getLoggedInUser).mockResolvedValue(null);

            await expect(infoPageActions.deleteInfoPage(infoPageId)).rejects.toThrow(
                "Unauthorized",
            );
        });

        it("rejects invalid info page id", async () => {
            await expect(infoPageActions.deleteInfoPage("not-a-uuid")).rejects.toThrow();
        });
    });
});
