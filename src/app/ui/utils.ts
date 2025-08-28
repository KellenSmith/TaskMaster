import { Prisma } from "@prisma/client";
import dayjs, { Dayjs } from "dayjs";
import Error from "next/error";

export const formatDate = (date: string | Date | Dayjs): string => dayjs(date).format("L HH:mm");
export const formatPrice = (price: number): number => price / 100;

export const openResourceInNewTab = (resourceUrl: string) => {
    const newWindow = window.open(resourceUrl, "_blank", "noopener,noreferrer");
    // Prevent reverse tabnabbing
    if (newWindow) newWindow.opener = null;
};

export const allowRedirectException = (error: Error & { digest?: string }) => {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
    }
};

export const userHasSkillBadge = (
    user: Prisma.UserGetPayload<{
        select: { id: true; nickname: true; skillBadges: true };
    }>,
    skillBadgeId: string,
): boolean => {
    return user.skillBadges.some((userBadge) => userBadge.skillBadgeId === skillBadgeId);
};

export const isUserQualifiedForTask = (
    user: Prisma.UserGetPayload<{
        select: { id: true; nickname: true; skillBadges: true };
    }>,
    requiredTaskSkillBadges: Prisma.TaskSkillBadgeGetPayload<true>[],
) =>
    requiredTaskSkillBadges.every((taskSkillBadge) =>
        userHasSkillBadge(user, taskSkillBadge.skillBadgeId),
    );
