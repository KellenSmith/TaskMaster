import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import ProtectedPage from "../../ProtectedPage";
import SkillBadgesDashboard from "./SkillBadgesDashboard";

const getCachedSkillBadges = async () => {
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const SkillBadgesPage = async () => {
    const skillBadgesPromise = getCachedSkillBadges();

    return (
        <ProtectedPage name={GlobalConstants.SKILL_BADGES}>
            <SkillBadgesDashboard skillBadgesPromise={skillBadgesPromise} />
        </ProtectedPage>
    );
};

export default SkillBadgesPage;
