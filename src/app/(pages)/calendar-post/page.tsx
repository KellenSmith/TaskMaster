"use server";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import EventDashboard from "./EventDashboard";
import GlobalConstants from "../../GlobalConstants";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
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

    const eventTasksPromise = prisma.task.findMany({
        where: { event_id: eventId },
        include: {
            assignee: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
            skill_badges: true,
        },
    });
    const eventTicketsPromise = prisma.ticket.findMany({
        where: {
            event_id: eventId,
        },
        include: {
            product: true,
            event_participants: true,
        },
    });
    const activeMembersPromise = getActiveMembers();
    const skillBadgesPromise = prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
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
    const eventReservesPromise = prisma.eventReserve.findMany({
        where: { event_id: eventId },
        include: {
            user: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
        },
    });
    const locationsPromise = prisma.location.findMany()
    const events = await prisma.event.findMany({ select: { tags: true } });
    const uniqueEventTags = [...new Set(events.flatMap(e => e.tags))];

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
                eventTags={uniqueEventTags}
            />
        </ErrorBoundarySuspense>
    );
};

export default EventPage;
