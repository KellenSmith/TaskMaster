import { describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import { mockContext } from "../../test/mocks/prismaMock";
import type { TransactionClient } from "../../test/types/test-types";
import * as textContentActions from "./text-content-actions";
import { sanitizeRichText } from "./html-sanitizer";
import { Language } from "../../prisma/generated/enums";
import { getTextContentCacheTag } from "./text-content-actions";
import { waitFor } from "@testing-library/react";
import { prisma } from "../../prisma/prisma-client";
import { getDefaultTextContent } from "./text-content-helpers";

vi.mock("./html-sanitizer", () => ({
    sanitizeRichText: vi.fn(),
}));

describe("text-content-actions", () => {
    const textContentId = "550e8400-e29b-41d4-a716-446655440000";

    describe("createTextContent", () => {
        it("creates text content with default translations", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const created = {
                id: textContentId,
                translations: [
                    {
                        language: Language.english,
                        text: '<p><span style="color: rgb(255, 255, 255);">placeholder</span></p>',
                    },
                    {
                        language: Language.swedish,
                        text: '<p><span style="color: rgb(255, 255, 255);">platshållare</span></p>',
                    },
                ],
            };
            vi.mocked(tx.textContent.create).mockResolvedValue(created as any);

            const result = await textContentActions.createTextContent(tx as any, textContentId);

            expect(tx.textContent.create).toHaveBeenCalledWith({
                data: {
                    id: textContentId,
                    translations: {
                        createMany: {
                            data: [
                                {
                                    language: Language.english,
                                    text: '<p><span style="color: rgb(255, 255, 255);">placeholder</span></p>',
                                },
                                {
                                    language: Language.swedish,
                                    text: '<p><span style="color: rgb(255, 255, 255);">platshållare</span></p>',
                                },
                            ],
                        },
                    },
                },
                include: { translations: true },
            });
            expect(result).toEqual(created);
        });

        it("creates text content without id when null provided", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const created = {
                id: "auto-generated-id",
                translations: [],
            };
            vi.mocked(tx.textContent.create).mockResolvedValue(created as any);

            await textContentActions.createTextContent(tx as any, null);

            expect(tx.textContent.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        id: undefined,
                    }),
                }),
            );
        });
    });

    describe("getTextContent", () => {
        it("returns existing text content when found", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const existing = {
                id: textContentId,
                translations: [
                    { language: Language.english, text: "Hello" },
                    { language: Language.swedish, text: "Hej" },
                ],
            };

            vi.mocked(tx.textContent.findUnique).mockResolvedValue(existing as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const result = await textContentActions.getCachedTextContent(textContentId);

            expect(tx.textContent.findUnique).toHaveBeenCalledWith({
                where: { id: textContentId },
                include: { translations: true },
            });
            expect(result).toEqual(existing);
        });

        it("returns default text content when not found", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const created = {
                id: textContentId,
                translations: [
                    { language: Language.english, text: "placeholder" },
                    { language: Language.swedish, text: "platshållare" },
                ],
            };

            vi.mocked(tx.textContent.findUnique).mockResolvedValue(null);
            vi.mocked(tx.textContent.create).mockResolvedValue(created as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const result = await textContentActions.getCachedTextContent(textContentId);

            expect(tx.textContent.findUnique).toHaveBeenCalled();
            expect(result).toEqual(await getDefaultTextContent(textContentId));
        });
    });

    describe("updateTextContent", () => {
        it("updates text content, sanitizes, and revalidates", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const rawText = "<p>Hello <script>alert('xss')</script></p>";
            const sanitized = "<p>Hello </p>";

            vi.mocked(sanitizeRichText).mockReturnValue(sanitized);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await textContentActions.updateTextContent(
                textContentId,
                Language.english,
                rawText,
                "organization",
            );

            expect(vi.mocked(sanitizeRichText)).toHaveBeenCalledWith(rawText);
            expect(tx.textContent.upsert).toHaveBeenCalledWith({
                where: { id: textContentId },
                create: {
                    id: textContentId,
                    category: "organization",
                    translations: {
                        create: {
                            language: Language.english,
                            text: sanitized,
                        },
                    },
                },
                update: {
                    category: "organization",
                    translations: {
                        upsert: {
                            where: {
                                language_text_content_id: {
                                    language: Language.english,
                                    text_content_id: textContentId,
                                },
                            },
                            create: {
                                language: Language.english,
                                text: sanitized,
                            },
                            update: {
                                text: sanitized,
                            },
                        },
                    },
                },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                await getTextContentCacheTag(textContentId),
                "max",
            );
        });

        it("updates text content without category when omitted", async () => {
            const sanitized = "<p>Hello</p>";

            vi.mocked(sanitizeRichText).mockReturnValue(sanitized);

            await textContentActions.updateTextContent(
                textContentId,
                Language.swedish,
                "<p>Hello</p>",
            );

            await waitFor(async () =>
                expect(vi.mocked(prisma.textContent.upsert)).toHaveBeenCalledWith(
                    expect.objectContaining({
                        create: expect.objectContaining({
                            category: null,
                        }),
                        update: expect.objectContaining({
                            category: null,
                        }),
                    }),
                ),
            );
        });
    });
});
