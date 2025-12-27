"use server";

import { getAllUsers, getLoggedInUser } from "../../lib/user-actions";
import MembersDashboard from "./MembersDashboard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { prisma } from "../../../../prisma/prisma-client";

const MembersPage = async () => {
    const loggedInUser = await getLoggedInUser();

    const membersPromise = getAllUsers(loggedInUser.id);
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
