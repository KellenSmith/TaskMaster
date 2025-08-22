"use server";
import { unstable_cache } from "next/cache";
import { getLoggedInUser } from "../../lib/user-actions";
import ProfileDashboard from "./ProfileDashboard";
import { getFilteredTasks } from "../../lib/task-actions";
import GlobalConstants from "../../GlobalConstants";
import { getFilteredEvents } from "../../lib/event-actions";

const ProfilePage = async () => {
    const loggedInUser = await getLoggedInUser();

    const tasksPromise = unstable_cache(getFilteredTasks, [loggedInUser.id], {
        tags: [GlobalConstants.TASK],
    })({ assigneeId: loggedInUser.id, reviewerId: loggedInUser.id });
    const eventsPromise = unstable_cache(getFilteredEvents, [loggedInUser.id], {
        tags: [GlobalConstants.EVENT],
    })({
        OR: [
            { hostId: loggedInUser.id },
            { participantUsers: { some: { userId: loggedInUser.id } } },
            { reserveUsers: { some: { userId: loggedInUser.id } } },
        ],
    });

    return <ProfileDashboard tasksPromise={tasksPromise} eventsPromise={eventsPromise} />;
};

export default ProfilePage;
