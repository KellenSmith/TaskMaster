"use server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { Language, Prisma } from "@prisma/client";
import { sanitizeRichText } from "./html-sanitizer";

export const createTextContent = async (
    tx: Prisma.TransactionClient,
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

export const getTextContent = async (
    id: string | null = null,
): Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>> => {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (!id) return await createTextContent(tx, id);

        let textContent = await tx.textContent.findUnique({
            where: {
                id: id,
            },
            include: {
                translations: true,
            },
        });

        // If the text content doesn't exist, create a default
        if (!textContent) textContent = await createTextContent(tx, id);
        return textContent;
    });
};

export const updateTextContent = async (
    id: string,
    language: Language,
    text: string,
    category?: string,
): Promise<void> => {
    // Sanitize rich text content before saving
    const sanitizedText = sanitizeRichText(text);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.textContent.upsert({
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
                                text_content_id: id,
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
    });
    revalidateTag(GlobalConstants.TEXT_CONTENT);
};
