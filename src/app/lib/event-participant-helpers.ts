import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Prisma } from "../../prisma/generated/client";
import { prisma } from "../../prisma/prisma-client";
import { getLoggedInUser } from "./user-helpers";

dayjs.extend(utc);

export const upcomingTicketInclude = {
    ticket: {
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    start_time: true,
                    end_time: true,
                    location: { select: { name: true } },
                },
            },
        },
    },
} satisfies Prisma.EventParticipantInclude;

export type UpcomingEventParticipant = Prisma.EventParticipantGetPayload<{
    include: typeof upcomingTicketInclude;
}>;

/**
 * Every ticket the logged-in user holds for an event that has not ended yet,
 * soonest first. Shared by the dashboard and the appbar so "my events" means
 * the same thing everywhere.
 */
export const getUpcomingEventParticipants = async (): Promise<UpcomingEventParticipant[]> => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) return [];

    const participants = await prisma.eventParticipant.findMany({
        where: {
            user_id: loggedInUser.id,
            ticket: {
                event: {
                    end_time: {
                        gt: dayjs.utc().toDate(), // Only tickets for events that haven't ended yet
                    },
                },
            },
        },
        include: upcomingTicketInclude,
        orderBy: {
            ticket: {
                event: {
                    start_time: "asc",
                },
            },
        },
    });

    return participants as UpcomingEventParticipant[];
};
