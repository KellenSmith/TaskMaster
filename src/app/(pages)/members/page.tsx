"use server";

import { getAllUsers, getLoggedInUser } from "../../lib/user-actions";
import GlobalConstants from "../../GlobalConstants";
import { unstable_cache } from "next/cache";
import MembersDashboard from "./MembersDashboard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getAllSkillBadges } from "../../lib/skill-badge-actions";

const MembersPage = async () => {
    const loggedInUser = await getLoggedInUser();

    const membersPromise = unstable_cache(getAllUsers, [loggedInUser.id], {
        tags: [GlobalConstants.USER],
    })(loggedInUser.id);
    const skillBadgesPromise = unstable_cache(getAllSkillBadges, [], {
        tags: [GlobalConstants.SKILL_BADGES],
    })();

    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <ErrorBoundarySuspense>
            <MembersDashboard
                membersPromise={membersPromise}
                skillBadgesPromise={skillBadgesPromise}
            />
        </ErrorBoundarySuspense>
    );
};

export default MembersPage;
