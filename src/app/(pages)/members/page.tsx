"use server";

import MembersDashboard from "./MembersDashboard";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import { cacheTag } from "next/cache";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const getMembers = async () => {
    "use cache";
    cacheTag(GlobalConstants.USER);
    return await prisma.user.findMany({
        include: {
            user_membership: true,
            skill_badges: true,
        },
    });
};

const getSkillBadges = async () => {
    "use cache";
    cacheTag(GlobalConstants.SKILL_BADGE);
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const MembersPage = async () => {
    // TODO: If on mobile, just show list of pending members, viewable and validatable
    // TODO: Extend filter options
    return (
        <ErrorBoundarySuspense>
            <MembersDashboard membersPromise={getMembers()} skillBadgesPromise={getSkillBadges()} />
        </ErrorBoundarySuspense>
    );
};

export default MembersPage;
