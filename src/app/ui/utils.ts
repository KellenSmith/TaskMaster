import { Prisma } from "@prisma/client";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import Error from "next/error";

// Ensure all date formatting uses UTC to avoid environment-specific timezone shifts
dayjs.extend(utc);

export const formatDate = (date: string | Date | Dayjs): string =>
    dayjs.utc(date).format("YYYY/MM/DD HH:mm");
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
        select: { id: true; nickname: true; skill_badges: true };
    }>,
    skillBadgeId: string,
): boolean => {
    return user.skill_badges.some((userBadge) => userBadge.skill_badge_id === skillBadgeId);
};

export const isUserQualifiedForTask = (
    user: Prisma.UserGetPayload<{
        select: { id: true; nickname: true; skill_badges: true };
    }>,
    requiredTaskSkillBadges: Prisma.TaskSkillBadgeGetPayload<true>[],
) =>
    requiredTaskSkillBadges.every((taskSkillBadge) =>
        userHasSkillBadge(user, taskSkillBadge.skill_badge_id),
    );
