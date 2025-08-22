import { describe, it, expect } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import { getTextContent, updateTextContent } from "./text-content-actions";
import GlobalConstants from "../GlobalConstants";

const mockTextContent = {
    id: "test-content-id",
    language: GlobalConstants.ENGLISH,
    content: "Test content",
    category: "test-category",
};

describe("Text Content Actions", () => {
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
                    content: '<p><span style="color: rgb(255, 255, 255);">placeholder</span></p>',
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
});
