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
import ProtectedPage from "../../ProtectedPage";

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
    return await prisma.ticket.findMany({
        where: { event_id: eventId },
        include: {
            product: true,
            event_participants: true,
        },
    });
};

const getEventActiveMembers = async () => {
    return await getCachedActiveMembersFromUserHelpers();
};

const getCachedLocations = async () => {
    return await prisma.location.findMany();
};

const getCachedSkillBadges = async () => {
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const getCachedEventParticipants = async (eventId: string) => {
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
        <ProtectedPage name={GlobalConstants.CALENDAR_POST}>
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
        </ProtectedPage>
    );
};

export default EventPage;
