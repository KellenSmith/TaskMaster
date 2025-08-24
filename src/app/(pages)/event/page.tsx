"use server";
import { getEventById } from "../../lib/event-actions";
import { getFilteredTasks } from "../../lib/task-actions";
import { getActiveMembers } from "../../lib/user-actions";
import EventDashboard from "./EventDashboard";
import { unstable_cache } from "next/cache";
import GlobalConstants from "../../GlobalConstants";
import { getEventTickets } from "../../lib/ticket-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

interface EventPageProps {
    searchParams: Promise<{ [eventId: string]: string }>;
}

const EventPage = async ({ searchParams }: EventPageProps) => {
    const eventId = (await searchParams).eventId;

    const eventPromise = unstable_cache(getEventById, [eventId], {
        tags: [GlobalConstants.EVENT],
    })(eventId);
    const eventTasksPromise = unstable_cache(getFilteredTasks, [eventId], {
        tags: [GlobalConstants.TASK],
    })({ eventId });
    const eventTicketsPromise = unstable_cache(getEventTickets, [eventId], {
        tags: [GlobalConstants.TICKET],
    })(eventId);
    const activeMembersPromise = unstable_cache(getActiveMembers, [], {
        tags: [GlobalConstants.USER],
    })();

    return (
        <ErrorBoundarySuspense errorMessage="Failed to load event">
            <EventDashboard
                eventPromise={eventPromise}
                eventTasksPromise={eventTasksPromise}
                eventTicketsPromise={eventTicketsPromise}
                activeMembersPromise={activeMembersPromise}
            />
        </ErrorBoundarySuspense>
    );
};

export default EventPage;
