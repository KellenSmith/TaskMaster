"use server";

import MembersDashboard from "./MembersDashboard";
import { prisma } from "../../../prisma/prisma-client";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";

const getMembers = async () => {
    return await prisma.user.findMany({
        include: {
            user_membership: true,
            skill_badges: true,
        },
    });
};

const getSkillBadges = async () => {
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const MembersPage = async () => {
    // TODO: If on mobile, just show list of pending members, viewable and validatable
    // TODO: Extend filter options
    return (
        <ProtectedPage name={GlobalConstants.MEMBERS}>
            <ErrorBoundarySuspense>
                <MembersDashboard
                    membersPromise={getMembers()}
                    skillBadgesPromise={getSkillBadges()}
                />
            </ErrorBoundarySuspense>
        </ProtectedPage>
    );
};

export default MembersPage;
