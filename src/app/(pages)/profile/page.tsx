"use server";
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

    const tasksPromise = getFilteredTasks({ OR: [{ assignee_id: loggedInUser.id }, { reviewer_id: loggedInUser.id }] });
    const eventsPromise = getFilteredEvents({
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
    const skillBadgesPromise = getAllSkillBadges();

    return (
        <ProfileDashboard
            tasksPromise={tasksPromise}
            eventsPromise={eventsPromise}
            skillBadgesPromise={skillBadgesPromise}
        />
    );
};

export default ProfilePage;
