"use server";
import { getEventById } from "../../lib/event-actions";
import { getFilteredTasks } from "../../lib/task-actions";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import EventDashboard from "./EventDashboard";
import { unstable_cache } from "next/cache";
import GlobalConstants from "../../GlobalConstants";
import { getEventTickets } from "../../lib/ticket-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getEventParticipants } from "../../lib/event-participant-actions";
import { getEventReserves } from "../../lib/event-reserve-actions";

interface EventPageProps {
    searchParams: Promise<{ [eventId: string]: string }>;
}

const EventPage = async ({ searchParams }: EventPageProps) => {
    const eventId = (await searchParams).eventId;

    // Make sure the user is available before fetching the event
    // When cloning events the user goes from possibly not host to host
    // of the shown event which causes timing issues
    const loggedInUser = await getLoggedInUser();

    const eventPromise = unstable_cache(getEventById, [eventId, loggedInUser.id], {
        tags: [GlobalConstants.EVENT],
    })(eventId, loggedInUser.id);
    const eventTasksPromise = unstable_cache(getFilteredTasks, [eventId], {
        tags: [GlobalConstants.TASK],
    })({ eventId });
    const eventTicketsPromise = unstable_cache(getEventTickets, [eventId], {
        tags: [GlobalConstants.TICKET],
    })(eventId);
    const activeMembersPromise = unstable_cache(getActiveMembers, [], {
        tags: [GlobalConstants.USER],
    })();
    const eventParticipantsPromise = unstable_cache(getEventParticipants, [eventId], {
        tags: [GlobalConstants.PARTICIPANT_USERS],
    })(eventId);

    const eventReservesPromise = unstable_cache(getEventReserves, [eventId], {
        tags: [GlobalConstants.RESERVE_USERS],
    })(eventId);

    return (
        <ErrorBoundarySuspense errorMessage="Failed to load event">
            <EventDashboard
                eventPromise={eventPromise}
                eventTasksPromise={eventTasksPromise}
                eventTicketsPromise={eventTicketsPromise}
                activeMembersPromise={activeMembersPromise}
                eventParticipantsPromise={eventParticipantsPromise}
                eventReservesPromise={eventReservesPromise}
            />
        </ErrorBoundarySuspense>
    );
};

export default EventPage;
