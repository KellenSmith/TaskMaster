import { getAllSkillBadges } from "../../lib/skill-badge-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import SkillBadgesDashboard from "./SkillBadgesDashboard";
import { unstable_cache } from "next/cache";
import GlobalConstants from "../../GlobalConstants";

const SkillBadgesPage = async () => {
    const skillBadgesPromise = unstable_cache(getAllSkillBadges, [], {
        tags: [GlobalConstants.SKILL_BADGES],
    })();

    return (
        <ErrorBoundarySuspense>
            <SkillBadgesDashboard skillBadgesPromise={skillBadgesPromise} />
        </ErrorBoundarySuspense>
    );
};

export default SkillBadgesPage;
