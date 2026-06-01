"use server";
import EventDashboard from "./EventDashboard";
import GlobalConstants from "../../GlobalConstants";
import { prisma } from "../../../prisma/prisma-client";
import { isUserAdmin } from "../../lib/utils";
import { EventStatus } from "../../../prisma/generated/enums";
import {
    getCachedActiveMembers as getCachedActiveMembersFromUserHelpers,
    getLoggedInUser,
} from "../../lib/user-helpers";
import { cacheTag } from "next/cache";
import { getEventCacheTag } from "../../lib/event-actions";
import { getEventTasksCacheTag } from "../../lib/task-actions";
import { getEventTicketsCacheTag } from "../../lib/ticket-actions";
import { getEventParticipantCacheTag } from "../../lib/event-participant-actions";
import { getEventReservesCacheTag } from "../../lib/event-reserve-actions";

interface EventPageProps {
    searchParams: Promise<{ [eventId: string]: string }>;
}

const assertUserCanViewEvent = async (
    loggedInUser: Awaited<ReturnType<typeof getLoggedInUser>>,
    eventPromise: ReturnType<typeof getEvent>,
) => {
    if (!loggedInUser) throw new Error("Unauthorized");

    const event = await eventPromise;

    if (
        event.status !== EventStatus.published &&
        !isUserAdmin(loggedInUser) &&
        event.host_id !== loggedInUser.id
    ) {
        throw new Error("Unauthorized");
    }
};

const getEvent = async (eventId: string) => {
    "use cache";
    cacheTag(await getEventCacheTag(eventId));

    return prisma.event.findUniqueOrThrow({
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
};

const getEventTasks = async (eventId: string) => {
    "use cache";
    cacheTag(await getEventTasksCacheTag(eventId));

    return await prisma.task.findMany({
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
};

const getEventTickets = async (eventId: string) => {
    "use cache";
    cacheTag(await getEventTicketsCacheTag(eventId));

    return await prisma.ticket.findMany({
        where: { event_id: eventId },
        include: {
            product: true,
            event_participants: true,
        },
    });
};

const getEventActiveMembers = async () => {
    "use cache";
    cacheTag(GlobalConstants.USER);

    return await getCachedActiveMembersFromUserHelpers();
};

const getCachedLocations = async () => {
    "use cache";
    cacheTag(GlobalConstants.LOCATION);

    return await prisma.location.findMany();
};

const getCachedSkillBadges = async () => {
    "use cache";
    cacheTag(GlobalConstants.SKILL_BADGE);

    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const getCachedEventParticipants = async (eventId: string) => {
    "use cache";
    cacheTag(await getEventParticipantCacheTag(eventId));

    return await prisma.eventParticipant.findMany({
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
};

const getCachedEventReserves = async (eventId: string) => {
    "use cache";
    cacheTag(await getEventReservesCacheTag(eventId));

    return await prisma.eventReserve.findMany({
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
};

const getCachedEventTags = async () => {
    "use cache";
    cacheTag(GlobalConstants.EVENT);

    const events = await prisma.event.findMany({ select: { tags: true } });
    const uniqueEventTags = [...new Set(events.flatMap((e) => e.tags))];
    return uniqueEventTags;
};

const EventPage = async ({ searchParams }: EventPageProps) => {
    const eventId = (await searchParams)[GlobalConstants.EVENT_ID];

    const loggedInUser = await getLoggedInUser();
    const eventPromise = getEvent(eventId);

    // Authorize from the event payload to optimize the authenticated hot path.
    await assertUserCanViewEvent(loggedInUser, eventPromise);

    const eventTasksPromise = getEventTasks(eventId);
    const eventTicketsPromise = getEventTickets(eventId);
    const activeMembersPromise = getEventActiveMembers();
    const locationsPromise = getCachedLocations();
    const skillBadgesPromise = getCachedSkillBadges();
    const eventParticipantsPromise = getCachedEventParticipants(eventId);
    const eventReservesPromise = getCachedEventReserves(eventId);
    const eventTagsPromise = getCachedEventTags();

    // TODO: Optimize database queries based on role and need for data (e.g. only fetch locations if user is host or admin)
    return (
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
    );
};

export default EventPage;
