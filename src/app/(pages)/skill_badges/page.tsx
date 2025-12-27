import { prisma } from "../../../../prisma/prisma-client";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import SkillBadgesDashboard from "./SkillBadgesDashboard";

const SkillBadgesPage = async () => {
    const skillBadgesPromise = prisma.skillBadge.findMany({ include: { user_skill_badges: true } });

    return (
        <ErrorBoundarySuspense>
            <SkillBadgesDashboard skillBadgesPromise={skillBadgesPromise} />
        </ErrorBoundarySuspense>
    );
};

export default SkillBadgesPage;
