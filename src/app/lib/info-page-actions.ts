"use server";
import { prisma } from "../../prisma/prisma-client";
import { getLoggedInUser } from "./user-actions";
import { InfoPageCreateSchema, UuidSchema } from "./zod-schemas";
import { serverRedirect } from "./utils";
import GlobalConstants from "../GlobalConstants";
import { createTextContent } from "./text-content-actions";
import { revalidateTag } from "next/cache";
import { Language, UserRole } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/client";

export const createInfoPage = async (formData: FormData): Promise<void> => {
    const validatedData = InfoPageCreateSchema.parse(Object.fromEntries(formData.entries()));

    let createdInfoPageId: string = "";
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const title = await createTextContent(tx);
        await tx.textTranslation.updateMany({
            where: { text_content_id: title.id },
            data: { text: validatedData.title },
        });

        const content = await createTextContent(tx);

        const newInfoPage = await tx.infoPage.create({
            data: {
                lowest_allowed_user_role: validatedData.lowest_allowed_user_role || null,
                titleText: {
                    connect: { id: title.id },
                },
                content: {
                    connect: { id: content.id },
                },
            },
        });
        createdInfoPageId = newInfoPage.id;
    });
    if (!createdInfoPageId) throw new Error("Failed to create InfoPage");

    revalidateTag(GlobalConstants.INFO_PAGE, "max");
    serverRedirect([GlobalConstants.INFO_PAGE], {
        [GlobalConstants.INFO_PAGE_ID]: createdInfoPageId,
    });
};

export const updateInfoPage = async (
    formData: FormData,
    infoPageId: string,
    language: Language,
): Promise<void> => {
    const validatedData = InfoPageCreateSchema.parse(Object.fromEntries(formData.entries()));
    const validatedInfoPageId = UuidSchema.parse(infoPageId);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // First, update the InfoPage basic fields
        const updatedInfoPage = await tx.infoPage.update({
            where: { id: validatedInfoPageId },
            data: {
                lowest_allowed_user_role: validatedData.lowest_allowed_user_role || null,
            },
            include: { titleText: true },
        });

        // Update the title text translation
        if (updatedInfoPage.titleText) {
            await tx.textTranslation.update({
                where: {
                    language_text_content_id: {
                        language,
                        text_content_id: updatedInfoPage.titleText.id,
                    },
                },
                data: {
                    text: validatedData.title,
                },
            });
        }
        // Content is updated directly in the rich text component (InfoPageEditor)
    });
    revalidateTag(GlobalConstants.INFO_PAGE, "max");
};

export const deleteInfoPage = async (id: string): Promise<void> => {
    const validatedId = UuidSchema.parse(id);

    const loggedInUser = await getLoggedInUser();
    if (loggedInUser?.role !== UserRole.admin) throw new Error("Unauthorized");

    await prisma.infoPage.delete({
        where: { id: validatedId },
    });

    revalidateTag(GlobalConstants.INFO_PAGE, "max");
};
