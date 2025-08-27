"use server";
import { unstable_cache } from "next/cache";
import CalendarDashboard from "./CalendarDashboard";
import { getAllEvents } from "../../lib/event-actions";
import GlobalConstants from "../../GlobalConstants";
import { getLoggedInUser } from "../../lib/user-actions";

const CalendarPage = async () => {
    const loggedInUser = await getLoggedInUser();
    const eventsPromise = unstable_cache(getAllEvents, [loggedInUser.id], {
        tags: [GlobalConstants.EVENT],
    })(loggedInUser.id);

    return <CalendarDashboard eventsPromise={eventsPromise} />;
};

export default CalendarPage;
