"use server";
import { getEventById, getEventTags } from "../../lib/event-actions";
import { getFilteredTasks } from "../../lib/task-actions";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import EventDashboard from "./EventDashboard";
import GlobalConstants from "../../GlobalConstants";
import { getEventTickets } from "../../lib/ticket-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getEventParticipants } from "../../lib/event-participant-actions";
import { getEventReserves } from "../../lib/event-reserve-actions";
import { getAllLocations } from "../../lib/location-actions";
import { getAllSkillBadges } from "../../lib/skill-badge-actions";

interface EventPageProps {
    searchParams: Promise<{ [eventId: string]: string }>;
}

const EventPage = async ({ searchParams }: EventPageProps) => {
    const eventId = (await searchParams)[GlobalConstants.EVENT_ID];

    // Make sure the user is available before fetching the event
    // When cloning events the user goes from possibly not host to host
    // of the shown event which causes timing issues
    const loggedInUser = await getLoggedInUser();

    const eventPromise = getEventById(eventId, loggedInUser.id);
    const eventTasksPromise = getFilteredTasks({ event_id: eventId });
    const eventTicketsPromise = getEventTickets(eventId);
    const activeMembersPromise = getActiveMembers();
    const skillBadgesPromise = getAllSkillBadges();
    const eventParticipantsPromise = getEventParticipants(eventId);
    const eventReservesPromise = getEventReserves(eventId);
    const locationsPromise = getAllLocations();
    const eventTagsPromise = getEventTags();

    return (
        <ErrorBoundarySuspense>
            <EventDashboard
                eventPromise={eventPromise}
                eventTasksPromise={eventTasksPromise}
                eventTicketsPromise={eventTicketsPromise}
                activeMembersPromise={activeMembersPromise}
                skillBadgesPromise={skillBadgesPromise}
                eventParticipantsPromise={eventParticipantsPromise}
                eventReservesPromise={eventReservesPromise}
                locationsPromise={locationsPromise}
                eventTagsPromise={eventTagsPromise}
            />
        </ErrorBoundarySuspense>
    );
};

export default EventPage;
