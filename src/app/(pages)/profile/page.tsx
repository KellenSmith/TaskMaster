"use server";
import { unstable_cache } from "next/cache";
import { getLoggedInUser } from "../../lib/user-actions";
import ProfileDashboard from "./ProfileDashboard";
import { getFilteredTasks } from "../../lib/task-actions";
import GlobalConstants from "../../GlobalConstants";
import { getFilteredEvents } from "../../lib/event-actions";
import { serverRedirect } from "../../lib/definitions";

const ProfilePage = async () => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) serverRedirect([GlobalConstants.LOGIN]);

    const tasksPromise = unstable_cache(getFilteredTasks, [loggedInUser.id], {
        tags: [GlobalConstants.TASK],
    })({ assigneeId: loggedInUser.id, reviewerId: loggedInUser.id });
    const eventsPromise = unstable_cache(getFilteredEvents, [loggedInUser.id], {
        tags: [GlobalConstants.EVENT],
    })({
        OR: [
            { hostId: loggedInUser.id },
            {
                tickets: {
                    some: {
                        eventParticipants: {
                            some: {
                                userId: loggedInUser.id,
                            },
                        },
                    },
                },
            },
            { eventReserves: { some: { userId: loggedInUser.id } } },
        ],
    });

    return <ProfileDashboard tasksPromise={tasksPromise} eventsPromise={eventsPromise} />;
};

export default ProfilePage;
