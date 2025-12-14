"use server";

import { getAllUsers, getLoggedInUser } from "../../lib/user-actions";
import GlobalConstants from "../../GlobalConstants";
import MembersDashboard from "./MembersDashboard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getAllSkillBadges } from "../../lib/skill-badge-actions";

const MembersPage = async () => {
    const loggedInUser = await getLoggedInUser();

    const membersPromise = getAllUsers(loggedInUser.id);
    const skillBadgesPromise = getAllSkillBadges();

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
