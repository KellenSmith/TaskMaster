"use server";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "../../lib/user-actions";
import ProfileDashboard from "./ProfileDashboard";
import { getFilteredTasks } from "../../lib/task-actions";
import GlobalConstants from "../../GlobalConstants";
import { getFilteredEvents } from "../../lib/event-actions";
import { NextURL } from "next/dist/server/web/next-url";

const ProfilePage = async () => {
    const loggedInUser = await getLoggedInUser();

    if (!loggedInUser)
        redirect(new NextURL(`${GlobalConstants.LOGIN}`, process.env.VERCEL_URL).toString());

    const tasksPromise = unstable_cache(getFilteredTasks, [loggedInUser.id], {
        tags: [GlobalConstants.TASK],
    })({ assigneeId: loggedInUser.id, reviewerId: loggedInUser.id });
    const eventsPromise = unstable_cache(getFilteredEvents, [loggedInUser.id], {
        tags: [GlobalConstants.EVENT],
    })({
        OR: [
            { hostId: loggedInUser.id },
            {},
            { eventReserves: { some: { userId: loggedInUser.id } } },
        ],
    });

    return <ProfileDashboard tasksPromise={tasksPromise} eventsPromise={eventsPromise} />;
};

export default ProfilePage;
