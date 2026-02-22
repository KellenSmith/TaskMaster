"use server";

import MembersDashboard from "./MembersDashboard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { prisma } from "../../../prisma/prisma-client";

const MembersPage = async () => {
    const membersPromise = prisma.user.findMany({
        include: {
            user_membership: true,
            skill_badges: true,
        },
    });
    const skillBadgesPromise = prisma.skillBadge.findMany({ include: { user_skill_badges: true } });

    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <ErrorBoundarySuspense>
            <MembersDashboard
                membersPromise={membersPromise}
                skillBadgesPromise={skillBadgesPromise}
            />
        </ErrorBoundarySuspense>
    );
};

export default MembersPage;
