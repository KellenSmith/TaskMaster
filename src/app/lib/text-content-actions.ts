"use server";
import { revalidateTag } from "next/cache";
import { prisma, TransactionClient } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { sanitizeRichText } from "./html-sanitizer";
import { Language } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/client";
import { getDefaultTextContent } from "./text-content-helpers";

export const getTextContentCacheTag = async (id: string) => `${GlobalConstants.TEXT_CONTENT}:${id}`;

export const createTextContent = async (
    tx: TransactionClient,
    id: string | null = null,
): Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>> =>
    await tx.textContent.create({
        data: {
            id: id || undefined,
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
        include: {
            translations: true,
        },
    });

export const getCachedTextContent = async (
    id: string,
): Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>> => {
    let textContent = await prisma.textContent.findUnique({
        where: {
            id: id,
        },
        include: {
            translations: true,
        },
    });

    if (textContent) return textContent;
    return await getDefaultTextContent(id);
};

export const updateTextContent = async (
    id: string | undefined,
    language: Language,
    text: string,
    category?: string,
): Promise<void> => {
    // Sanitize rich text content before saving
    const sanitizedText = sanitizeRichText(text);

    await prisma.textContent.upsert({
        where: {
            id,
        },
        create: {
            id,
            category: category || null,
            translations: {
                create: {
                    language,
                    text: sanitizedText,
                },
            },
        },
        update: {
            category: category || null,
            translations: {
                upsert: {
                    where: {
                        language_text_content_id: {
                            language,
                            text_content_id: id as string,
                        },
                    },
                    create: {
                        language,
                        text: sanitizedText,
                    },
                    update: {
                        text: sanitizedText,
                    },
                },
            },
        },
    });

    if (id) revalidateTag(await getTextContentCacheTag(id), "max");
};
