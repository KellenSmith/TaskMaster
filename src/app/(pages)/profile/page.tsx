"use server";
import { unstable_cache } from "next/cache";
import ProfileDashboard from "./ProfileDashboard";
import { getFilteredTasks } from "../../lib/task-actions";
import GlobalConstants from "../../GlobalConstants";
import { getFilteredEvents } from "../../lib/event-actions";
import { serverRedirect } from "../../lib/utils";
import { getLoggedInUser } from "../../lib/user-actions";
import { getAllSkillBadges } from "../../lib/skill-badge-actions";

const ProfilePage = async () => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) serverRedirect([GlobalConstants.LOGIN]);

    const tasksPromise = unstable_cache(getFilteredTasks, [loggedInUser.id], {
        tags: [GlobalConstants.TASK],
    })({ OR: [{ assignee_id: loggedInUser.id }, { reviewer_id: loggedInUser.id }] });
    const eventsPromise = unstable_cache(getFilteredEvents, [loggedInUser.id], {
        tags: [GlobalConstants.EVENT],
    })({
        OR: [
            { host_id: loggedInUser.id },
            {
                tickets: {
                    some: {
                        event_participants: {
                            some: {
                                user_id: loggedInUser.id,
                            },
                        },
                    },
                },
            },
            { event_reserves: { some: { user_id: loggedInUser.id } } },
        ],
    });
    const skillBadgesPromise = unstable_cache(getAllSkillBadges, [loggedInUser.id], {
        tags: [GlobalConstants.SKILL_BADGE],
    })();

    return (
        <ProfileDashboard
            tasksPromise={tasksPromise}
            eventsPromise={eventsPromise}
            skillBadgesPromise={skillBadgesPromise}
        />
    );
};

export default ProfilePage;
