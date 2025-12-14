import { getAllSkillBadges } from "../../lib/skill-badge-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import SkillBadgesDashboard from "./SkillBadgesDashboard";
import GlobalConstants from "../../GlobalConstants";

const SkillBadgesPage = async () => {
    const skillBadgesPromise = getAllSkillBadges();

    return (
        <ErrorBoundarySuspense>
            <SkillBadgesDashboard skillBadgesPromise={skillBadgesPromise} />
        </ErrorBoundarySuspense>
    );
};

export default SkillBadgesPage;
