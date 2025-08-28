"use server";

import { Prisma } from "@prisma/client";
import z from "zod";
import { SkillBadgeCreateSchema } from "./zod-schemas";
import { prisma } from "../../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";

export const getAllSkillBadges = async (): Promise<Prisma.SkillBadgeGetPayload<true>[]> => {
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

export const createSkillBadge = async (
    parsedFieldValues: z.infer<typeof SkillBadgeCreateSchema>,
): Promise<void> => {
    await prisma.skillBadge.create({ data: parsedFieldValues });
    revalidateTag(GlobalConstants.SKILL_BADGES);
};

export const updateSkillBadge = async (
    skillBadgeId: string,
    parsedFieldValues: z.infer<typeof SkillBadgeCreateSchema>,
): Promise<void> => {
    await prisma.skillBadge.update({ where: { id: skillBadgeId }, data: parsedFieldValues });
    revalidateTag(GlobalConstants.SKILL_BADGES);
};

export const deleteSkillBadge = async (skillBadgeId: string): Promise<void> => {
    await prisma.skillBadge.delete({ where: { id: skillBadgeId } });
    revalidateTag(GlobalConstants.SKILL_BADGES);
};
