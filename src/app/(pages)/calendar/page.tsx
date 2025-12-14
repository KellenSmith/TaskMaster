"use server";
import CalendarDashboard from "./CalendarDashboard";
import { getAllEvents } from "../../lib/event-actions";
import GlobalConstants from "../../GlobalConstants";
import { getLoggedInUser } from "../../lib/user-actions";
import { getAllLocations } from "../../lib/location-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const CalendarPage = async () => {
    const loggedInUser = await getLoggedInUser();
    const eventsPromise = getAllEvents(loggedInUser.id);
    const locationsPromise = getAllLocations();

    return (
        <ErrorBoundarySuspense>
            <CalendarDashboard eventsPromise={eventsPromise} locationsPromise={locationsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default CalendarPage;
