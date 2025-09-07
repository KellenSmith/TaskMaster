"use server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { Language, Prisma } from "@prisma/client";
import { sanitizeRichText } from "./html-sanitizer";

export const getTextContent = async (
    id: string,
): Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>> => {
    let textContent = await prisma.textContent.findUnique({
        where: {
            id,
        },
        include: {
            translations: true,
        },
    });

    // If the text content doesn't exist, create a default
    if (!textContent)
        textContent = await prisma.textContent.create({
            data: {
                id,
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
    return textContent;
};

export const updateTextContent = async (
    id: string,
    language: Language,
    text: string,
    category?: string,
): Promise<void> => {
    // Sanitize rich text content before saving
    const sanitizedText = sanitizeRichText(text);

    await prisma.$transaction(async (tx) => {
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
