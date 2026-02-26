"use server";

import MembersDashboard from "./MembersDashboard";
// ...existing code...
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
        <MembersDashboard membersPromise={membersPromise} skillBadgesPromise={skillBadgesPromise} />
    );
};

export default MembersPage;
