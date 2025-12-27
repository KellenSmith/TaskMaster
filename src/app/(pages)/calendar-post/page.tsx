"use server";
import { getEventTags } from "../../lib/event-actions";
import { getFilteredTasks } from "../../lib/task-actions";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import EventDashboard from "./EventDashboard";
import GlobalConstants from "../../GlobalConstants";
import { getEventTickets } from "../../lib/ticket-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getEventReserves } from "../../lib/event-reserve-actions";
import { getAllLocations } from "../../lib/location-actions";
import { getAllSkillBadges } from "../../lib/skill-badge-actions";
import { prisma } from "../../../../prisma/prisma-client";
import { EventStatus } from "@prisma/client";
import { isUserAdmin, isUserHost } from "../../lib/utils";

interface EventPageProps {
    searchParams: Promise<{ [eventId: string]: string }>;
}

const EventPage = async ({ searchParams }: EventPageProps) => {
    const eventId = (await searchParams)[GlobalConstants.EVENT_ID];
    const loggedInUser = await getLoggedInUser();

    const event = await prisma.event.findUniqueOrThrow({
        where: {
            id: eventId,
        },
        include: {
            location: true,
            tickets: {
                include: {
                    event_participants: true,
                },
            },
            event_reserves: true,
        },
    });
    if (
        event.status !== EventStatus.published &&
        !isUserAdmin(loggedInUser) &&
        !isUserHost(loggedInUser, event)
    ) {
        throw new Error("You are not authorized to view this event");
    }

    const eventTasksPromise = getFilteredTasks({ event_id: eventId });
    const eventTicketsPromise = getEventTickets(eventId);
    const activeMembersPromise = getActiveMembers();
    const skillBadgesPromise = getAllSkillBadges();
    const eventParticipantsPromise = prisma.eventParticipant.findMany({
        where: { ticket: { event_id: eventId } },
        include: {
            user: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
        },
    });
    const eventReservesPromise = getEventReserves(eventId);
    const locationsPromise = getAllLocations();
    const eventTagsPromise = getEventTags();

    return (
        <ErrorBoundarySuspense>
            <EventDashboard
                eventPromise={new Promise((resolve) => resolve(event))}
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
