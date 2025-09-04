"use server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { Language, Prisma } from "@prisma/client";

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
                        text,
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
                            text,
                        },
                        update: {
                            text,
                        },
                    },
                },
            },
        });
    });
    revalidateTag(GlobalConstants.TEXT_CONTENT);
};
