"use server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { sanitizeRichText } from "./html-sanitizer";
import { Language } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/client";

let hasLoggedBuildFallbackForTextContent = false;

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === "phase-production-build";

const isExpectedBuildTimeDatabaseError = (error: unknown): boolean => {
    if (!error || typeof error !== "object") {
        return false;
    }

    const dbError = error as { code?: string; message?: string };
    return (
        dbError.code === "ETIMEDOUT" ||
        dbError.code === "ECONNREFUSED" ||
        dbError.code === "P1001" ||
        dbError.message?.includes("Can't reach database server") === true
    );
};

const getBuildFallbackTextContent = (
    id: string,
): Prisma.TextContentGetPayload<{ include: { translations: true } }> => {
    return {
        id,
        category: "organization",
        title_info_page_id: null,
        content_info_page_id: null,
        translations: [],
    };
};

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
    if (id && isBuildPhase()) {
        if (!hasLoggedBuildFallbackForTextContent) {
            hasLoggedBuildFallbackForTextContent = true;
            console.warn(
                "Using build-time fallback for text content because database is not reachable.",
            );
        }
        return getBuildFallbackTextContent(id);
    }

    try {
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
    } catch (error) {
        if (id && isExpectedBuildTimeDatabaseError(error)) {
            if (!hasLoggedBuildFallbackForTextContent) {
                hasLoggedBuildFallbackForTextContent = true;
                console.warn(
                    "Using build-time fallback for text content because database is not reachable.",
                );
            }
            return getBuildFallbackTextContent(id);
        }

        throw error;
    }
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
    revalidateTag(GlobalConstants.TEXT_CONTENT, "max");
};
