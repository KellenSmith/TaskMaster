"use server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { Prisma } from "@prisma/client";

export const getTextContent = async (
    id: string,
    language: string,
): Promise<Prisma.TextContentGetPayload<{ select: { content: true } }>> => {
    try {
        let textContent = await prisma.textContent.findUnique({
            where: {
                id_language: {
                    id,
                    language,
                },
            },
            select: {
                content: true,
            },
        });

        // If the text content doesn't exist, create a default
        if (!textContent)
            textContent = await prisma.textContent.create({
                data: {
                    id,
                    language,
                    content: '<p><span style="color: rgb(255, 255, 255);">placeholder</span></p>',
                },
                select: { content: true },
            });
        return textContent;
    } catch {
        throw new Error("Failed to fetch text content");
    }
};

export const updateTextContent = async (
    id: string,
    language: string,
    content: string,
    category?: string,
): Promise<void> => {
    try {
        await prisma.textContent.upsert({
            where: {
                id_language: {
                    id,
                    language,
                },
            },
            create: {
                id,
                language,
                content,
                category: category || null,
            },
            update: {
                language,
                content,
                category: category || null,
            },
        });
        revalidateTag(GlobalConstants.TEXT_CONTENT);
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update text content");
    }
};
