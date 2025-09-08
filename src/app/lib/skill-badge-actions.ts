"use server";

import { Prisma } from "@prisma/client";
import { SkillBadgeCreateSchema, UuidSchema } from "./zod-schemas";
import { prisma } from "../../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { deleteOldBlob } from "./organization-settings-actions";
import { sanitizeFormData } from "./html-sanitizer";

export const getAllSkillBadges = async (): Promise<Prisma.SkillBadgeGetPayload<true>[]> => {
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

export const createSkillBadge = async (formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = SkillBadgeCreateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    await prisma.skillBadge.create({ data: sanitizedData });
    revalidateTag(GlobalConstants.SKILL_BADGES);
};

export const updateSkillBadge = async (skillBadgeId: string, formData: FormData): Promise<void> => {
    // Validate skill badge ID format
    const validatedSkillBadgeId = UuidSchema.parse(skillBadgeId);
    // Revalidate input with zod schema - don't trust the client
    const validatedData = SkillBadgeCreateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    const oldSkillBadge = await prisma.skillBadge.findUnique({
        where: { id: validatedSkillBadgeId },
    });
    await deleteOldBlob(oldSkillBadge.image_url, sanitizedData.image_url);
    await prisma.skillBadge.update({ where: { id: validatedSkillBadgeId }, data: sanitizedData });
    revalidateTag(GlobalConstants.SKILL_BADGES);
};

export const deleteSkillBadge = async (skillBadgeId: string): Promise<void> => {
    // Validate skill badge ID format
    const validatedSkillBadgeId = UuidSchema.parse(skillBadgeId);

    const deletedSkillBadge = await prisma.skillBadge.delete({
        where: { id: validatedSkillBadgeId },
    });
    await deleteOldBlob(deletedSkillBadge.image_url);
    revalidateTag(GlobalConstants.SKILL_BADGES);
};
