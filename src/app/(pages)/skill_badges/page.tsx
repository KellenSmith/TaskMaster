import { prisma } from "../../../prisma/prisma-client";
import SkillBadgesDashboard from "./SkillBadgesDashboard";

const getCachedSkillBadges = async () => {
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const SkillBadgesPage = async () => {
    const skillBadgesPromise = getCachedSkillBadges();

    return <SkillBadgesDashboard skillBadgesPromise={skillBadgesPromise} />;
};

export default SkillBadgesPage;
