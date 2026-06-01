import { cacheTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import SkillBadgesDashboard from "./SkillBadgesDashboard";
import GlobalConstants from "../../GlobalConstants";

const getCachedSkillBadges = async () => {
    "use cache";
    cacheTag(GlobalConstants.SKILL_BADGE);

    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const SkillBadgesPage = async () => {
    const skillBadgesPromise = getCachedSkillBadges();

    return <SkillBadgesDashboard skillBadgesPromise={skillBadgesPromise} />;
};

export default SkillBadgesPage;
