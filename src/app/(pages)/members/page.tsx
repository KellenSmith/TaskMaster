"use server";

import MembersDashboard from "./MembersDashboard";
import { prisma } from "../../../prisma/prisma-client";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";
import { ImplementedUserType } from "../../ui/Datagrid";
import { getMembershipProducts } from "../../lib/user-membership-helpers";

const getMembers = async () => {
    const members = await prisma.user.findMany({
        include: {
            user_membership: true,
            skill_badges: true,
            blacklist_entry: { include: { created_by: { select: { nickname: true } } } },
        },
        orderBy: {
            created_at: "desc",
        },
    });
    return members as ImplementedUserType[];
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
                    membershipsPromise={getMembershipProducts()}
                />
            </ErrorBoundarySuspense>
        </ProtectedPage>
    );
};

export default MembersPage;
