"use server";
import { getEventById, getEventTags } from "../../lib/event-actions";
import { getFilteredTasks } from "../../lib/task-actions";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import EventDashboard from "./EventDashboard";
import { unstable_cache } from "next/cache";
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

    const eventPromise = unstable_cache(getEventById, [eventId, loggedInUser.id], {
        tags: [GlobalConstants.EVENT],
    })(eventId, loggedInUser.id);
    const eventTasksPromise = unstable_cache(getFilteredTasks, [eventId], {
        tags: [GlobalConstants.TASK],
    })({ event_id: eventId });
    const eventTicketsPromise = unstable_cache(getEventTickets, [eventId], {
        tags: [GlobalConstants.TICKET],
    })(eventId);
    const activeMembersPromise = unstable_cache(getActiveMembers, [], {
        tags: [GlobalConstants.USER],
    })();
    const skillBadgesPromise = unstable_cache(getAllSkillBadges, [], {
        tags: [GlobalConstants.SKILL_BADGE],
    })();
    const eventParticipantsPromise = unstable_cache(getEventParticipants, [eventId], {
        tags: [GlobalConstants.PARTICIPANT_USERS],
    })(eventId);
    const eventReservesPromise = unstable_cache(getEventReserves, [eventId], {
        tags: [GlobalConstants.RESERVE_USERS],
    })(eventId);
    const locationsPromise = unstable_cache(getAllLocations, [], {
        tags: [GlobalConstants.LOCATION],
    })();
    const eventTagsPromise = unstable_cache(getEventTags, [], {
        tags: [GlobalConstants.EVENT],
    })();

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
