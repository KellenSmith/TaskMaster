import { prisma } from "../../../prisma/prisma-client";
// ...existing code...
import SkillBadgesDashboard from "./SkillBadgesDashboard";

const SkillBadgesPage = async () => {
    const skillBadgesPromise = prisma.skillBadge.findMany({ include: { user_skill_badges: true } });

    return <SkillBadgesDashboard skillBadgesPromise={skillBadgesPromise} />;
};

export default SkillBadgesPage;
