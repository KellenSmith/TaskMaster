"use server";
import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { FormActionState } from "./definitions";

export const createTextContent = async (
    currentActionState: FormActionState,
    id: string,
    language: string = GlobalConstants.ENGLISH,
    content: string,
    category?: string,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.textContent.create({
            data: {
                id,
                language,
                content,
                category: category || null,
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = "Created text content";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const getTextContent = async (
    currentActionState: FormActionState,
    id: string,
    language: string,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
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

        if (!textContent) {
            textContent = await prisma.textContent.create({
                data: {
                    id,
                    language,
                    content: "placeholder",
                },
            });
        }
        newActionState.result = textContent.content;
        newActionState.errorMsg = "";
        newActionState.status = 200;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const updateTextContent = async (
    currentActionState: FormActionState,
    id: string,
    language: string,
    content: string,
    category?: string,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.textContent.update({
            where: {
                id_language: {
                    id,
                    language,
                },
            },
            data: {
                content,
                category: category || null,
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Updated text content";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const deleteTextContent = async (
    currentActionState: FormActionState,
    id: string,
    language: string,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.textContent.delete({
            where: {
                id_language: {
                    id,
                    language,
                },
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Deleted text content";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};
