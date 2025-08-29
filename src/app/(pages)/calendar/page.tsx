"use server";
import { unstable_cache } from "next/cache";
import CalendarDashboard from "./CalendarDashboard";
import { getAllEvents } from "../../lib/event-actions";
import GlobalConstants from "../../GlobalConstants";
import { getLoggedInUser } from "../../lib/user-actions";
import { getAllLocations } from "../../lib/location-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const CalendarPage = async () => {
    const loggedInUser = await getLoggedInUser();
    const eventsPromise = unstable_cache(getAllEvents, [loggedInUser.id], {
        tags: [GlobalConstants.EVENT],
    })(loggedInUser.id);
    const locationsPromise = unstable_cache(getAllLocations, [], {
        tags: [GlobalConstants.LOCATION],
    })();

    return (
        <ErrorBoundarySuspense>
            <CalendarDashboard eventsPromise={eventsPromise} locationsPromise={locationsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default CalendarPage;
