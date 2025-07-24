import { describe, it, expect } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import {
    createTextContent,
    getTextContent,
    updateTextContent,
    deleteTextContent,
} from "./text-content-actions";
import GlobalConstants from "../GlobalConstants";
import { defaultFormActionState } from "./definitions";

const mockTextContent = {
    id: "test-content-id",
    language: GlobalConstants.ENGLISH,
    content: "Test content",
    category: "test-category",
};

describe("Text Content Actions", () => {
    describe("createTextContent", () => {
        it("should create text content successfully", async () => {
            mockContext.prisma.textContent.create.mockResolvedValue(mockTextContent);

            const result = await createTextContent(
                defaultFormActionState,
                mockTextContent.id,
                mockTextContent.language,
                mockTextContent.content,
                mockTextContent.category,
            );

            expect(result.status).toBe(201);
            expect(result.result).toBe("Created text content");
            expect(mockContext.prisma.textContent.create).toHaveBeenCalledWith({
                data: mockTextContent,
            });
        });

        it("should handle create errors", async () => {
            mockContext.prisma.textContent.create.mockRejectedValue(new Error("Creation failed"));

            const result = await createTextContent(
                defaultFormActionState,
                mockTextContent.id,
                mockTextContent.language,
                mockTextContent.content,
            );

            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Creation failed");
            expect(result.result).toBe("");
        });
    });

    describe("getTextContent", () => {
        it("should get existing text content successfully", async () => {
            mockContext.prisma.textContent.findUnique.mockResolvedValue(mockTextContent);

            const result = await getTextContent(
                defaultFormActionState,
                mockTextContent.id,
                mockTextContent.language,
            );

            expect(result.status).toBe(200);
            expect(result.result).toBe(mockTextContent.content);
            expect(mockContext.prisma.textContent.findUnique).toHaveBeenCalledWith({
                where: {
                    id_language: {
                        id: mockTextContent.id,
                        language: mockTextContent.language,
                    },
                },
                select: { content: true },
            });
        });

        it("should create placeholder when text content not found", async () => {
            mockContext.prisma.textContent.findUnique.mockResolvedValue(null);
            mockContext.prisma.textContent.create.mockResolvedValue({
                ...mockTextContent,
                content: "placeholder",
                category: "organization",
            });

            const result = await getTextContent(
                defaultFormActionState,
                mockTextContent.id,
                mockTextContent.language,
            );

            expect(result.status).toBe(200);
            expect(result.result).toBe("placeholder");
            expect(mockContext.prisma.textContent.create).toHaveBeenCalledWith({
                data: {
                    id: mockTextContent.id,
                    language: mockTextContent.language,
                    content: "placeholder",
                },
            });
        });

        it("should handle errors", async () => {
            mockContext.prisma.textContent.findUnique.mockRejectedValue(
                new Error("Database error"),
            );

            const result = await getTextContent(
                defaultFormActionState,
                mockTextContent.id,
                mockTextContent.language,
            );

            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Database error");
            expect(result.result).toBe("");
        });
    });

    describe("updateTextContent", () => {
        it("should update text content successfully", async () => {
            mockContext.prisma.textContent.update.mockResolvedValue(mockTextContent);

            const result = await updateTextContent(
                defaultFormActionState,
                mockTextContent.id,
                mockTextContent.language,
                mockTextContent.content,
                mockTextContent.category,
            );

            expect(result.status).toBe(200);
            expect(result.result).toBe("Updated text content");
            expect(mockContext.prisma.textContent.update).toHaveBeenCalledWith({
                where: {
                    id_language: {
                        id: mockTextContent.id,
                        language: mockTextContent.language,
                    },
                },
                data: {
                    content: mockTextContent.content,
                    category: mockTextContent.category,
                },
            });
        });

        it("should handle update errors", async () => {
            mockContext.prisma.textContent.update.mockRejectedValue(new Error("Update failed"));

            const result = await updateTextContent(
                defaultFormActionState,
                mockTextContent.id,
                mockTextContent.language,
                mockTextContent.content,
            );

            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Update failed");
            expect(result.result).toBe("");
        });
    });

    describe("deleteTextContent", () => {
        it("should delete text content successfully", async () => {
            mockContext.prisma.textContent.delete.mockResolvedValue(mockTextContent);

            const result = await deleteTextContent(
                defaultFormActionState,
                mockTextContent.id,
                mockTextContent.language,
            );

            expect(result.status).toBe(200);
            expect(result.result).toBe("Deleted text content");
            expect(mockContext.prisma.textContent.delete).toHaveBeenCalledWith({
                where: {
                    id_language: {
                        id: mockTextContent.id,
                        language: mockTextContent.language,
                    },
                },
            });
        });

        it("should handle delete errors", async () => {
            mockContext.prisma.textContent.delete.mockRejectedValue(new Error("Delete failed"));

            const result = await deleteTextContent(
                defaultFormActionState,
                mockTextContent.id,
                mockTextContent.language,
            );

            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Delete failed");
            expect(result.result).toBe("");
        });
    });
});
