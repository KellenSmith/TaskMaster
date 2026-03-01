"use server";
import EventDashboard from "./EventDashboard";
import GlobalConstants from "../../GlobalConstants";
import { prisma } from "../../../prisma/prisma-client";
import { isUserAdmin, isUserHost } from "../../lib/utils";
import { EventStatus } from "../../../prisma/generated/enums";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-helpers";

interface EventPageProps {
    searchParams: Promise<{ [eventId: string]: string }>;
}

const EventPage = async ({ searchParams }: EventPageProps) => {
    const eventId = (await searchParams)[GlobalConstants.EVENT_ID];
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error("Unauthorized");

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
        throw new Error("Unauthorized");
    }

    // TODO: Optimize database queries based on role and need for data (e.g. only fetch locations if user is host or admin)
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
    const locationsPromise = prisma.location.findMany();
    const events = await prisma.event.findMany({ select: { tags: true } });
    const uniqueEventTags = [...new Set(events.flatMap((e) => e.tags))];

    return (
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
    );
};

export default EventPage;
