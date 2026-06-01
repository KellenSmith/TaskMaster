"use server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../prisma/prisma-client";
import { notifyEventReserves } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { deleteEventReserveWithTx, getEventReservesCacheTag } from "./event-reserve-actions";
import { UuidSchema } from "./zod-schemas";
import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import LanguageTranslations from "./LanguageTranslations";
import dayjs from "dayjs";
import { formatUtcDateToTimezone } from "../ui/utils";
import { prismaErrorCodes } from "../../prisma/prisma-error-codes";
import { Prisma } from "../../prisma/generated/client";
import { isUserAdmin } from "./utils";
import { connection } from "next/server";
import { getEventTicketsCacheTag } from "./ticket-actions";
import { getEventTasksCacheTag } from "./task-actions";

export const getEventParticipantCacheTag = async (eventId: string) =>
    `${GlobalConstants.PARTICIPANT_USERS}:event:${eventId}`;

export const getUserEventParticipantsCacheTag = async (userId: string) =>
    `${GlobalConstants.PARTICIPANT_USERS}:user:${userId}`;

export const getEventParticipantByIdCacheTag = async (eventParticipantId: string) =>
    `${GlobalConstants.PARTICIPANT_USERS}:${eventParticipantId}`;

export const addEventParticipantWithTx = async (
    tx: Prisma.TransactionClient,
    ticketId: string,
    userId: string,
) => {
    const ticket = await tx.ticket.findUniqueOrThrow({
        where: {
            product_id: ticketId,
        },
    });

    // Check that the event isn't sold out
    const event = await tx.event.findUniqueOrThrow({
        where: {
            id: ticket.event_id,
        },
        include: {
            tickets: {
                include: {
                    event_participants: true,
                },
            },
        },
    });
    const participantIds = event.tickets.flatMap((t) => t.event_participants.map((p) => p.user_id));
    if (participantIds.includes(userId)) throw new Error("Member is already a participant");
    if (participantIds.length >= event.max_participants) {
        throw new Error("Event is already sold out");
    }

    await deleteEventReserveWithTx(tx, userId, ticket.event_id);
    revalidateTag(await getEventReservesCacheTag(ticket.event_id), "max");

    // Decrement the product stock of all tickets with limited stock belonging to the same event
    // Ticket product stock reflects the total number of available tickets across all types
    await tx.product.updateMany({
        where: {
            ticket: {
                event_id: ticket.event_id,
            },
            NOT: {
                stock: null,
            },
        },
        data: {
            stock: {
                decrement: 1,
            },
        },
    });
    revalidateTag(await getEventTicketsCacheTag(ticket.event_id), "max");
    // Create the participant and connect it to the user, ticket, and event
    await tx.eventParticipant.create({
        data: {
            user: {
                connect: {
                    id: userId,
                },
            },
            ticket: {
                connect: {
                    product_id: ticketId,
                },
            },
        },
    });
    revalidateTag(await getEventParticipantCacheTag(ticket.event_id), "max");
};

export const addEventParticipant = async (userId: string, ticketId: string) => {
    const validatedUserId = UuidSchema.parse(userId);
    const validatedTicketId = UuidSchema.parse(ticketId);

    await connection();
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await addEventParticipantWithTx(tx, validatedTicketId, validatedUserId);
    });
};

export const deleteEventParticipantWithTx = async (
    tx: Prisma.TransactionClient,
    eventId: string,
    userId: string,
) => {
    // Find the ticket the user holds to the event
    const ticket = await tx.ticket.findFirstOrThrow({
        where: {
            event_id: eventId,
            event_participants: {
                some: {
                    user_id: userId,
                },
            },
        },
    });

    const eventParticipantsToDelete = await tx.eventParticipant.findMany({
        where: {
            user_id: userId,
            ticket_id: ticket.product_id,
        },
    });

    await tx.eventParticipant.deleteMany({
        where: {
            user_id: userId,
            ticket_id: ticket.product_id,
        },
    });

    if (eventParticipantsToDelete.length > 0) {
        const deletedEventParticipant = eventParticipantsToDelete[0];
        revalidateTag(await getEventParticipantByIdCacheTag(deletedEventParticipant.id), "max");
        revalidateTag(await getEventParticipantCacheTag(eventId), "max");
        revalidateTag(await getUserEventParticipantsCacheTag(userId), "max");
    }
    // Increment the product stock of all tickets with limited stock belonging to the same event
    // Ticket product stock reflects the total number of available tickets across all types
    await tx.product.updateMany({
        where: {
            ticket: {
                event_id: eventId,
            },
            NOT: {
                stock: null,
            },
        },
        data: {
            stock: {
                increment: 1,
            },
        },
    });

    revalidateTag(await getEventTicketsCacheTag(eventId), "max");
    await notifyEventReserves(eventId);
};

export const deleteEventParticipant = async (eventId: string, userId: string) => {
    const validatedEventId = UuidSchema.parse(eventId);
    const validatedUserId = UuidSchema.parse(userId);

    await connection();
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await deleteEventParticipantWithTx(tx, validatedEventId, validatedUserId);
        await unassignUserFromEventTasks(tx, validatedEventId, validatedUserId);
    });
};

export const unassignUserFromEventTasks = async (
    tx: Prisma.TransactionClient,
    eventId: string,
    userId: string,
) => {
    // Unassign any tasks assigned to the user happening during the event
    const event = await tx.event.findUniqueOrThrow({
        where: { id: eventId },
    });
    await tx.task.updateMany({
        where: {
            AND: [
                {
                    OR: [
                        {
                            start_time: {
                                gte: event.start_time,
                                lte: event.end_time,
                            },
                        },
                        {
                            end_time: {
                                gte: event.start_time,
                                lte: event.end_time,
                            },
                        },
                    ],
                },
            ],
            event_id: eventId,
            assignee_id: userId,
        },
        data: {
            assignee_id: null,
        },
    });

    revalidateTag(await getEventTasksCacheTag(eventId), "max");
};

export const checkInEventParticipant = async (
    eventParticipantId: string,
): Promise<void | string> => {
    const validatedEventParticipantId = UuidSchema.parse(eventParticipantId);
    const loggedInUser = await getLoggedInUser();
    const language = await getUserLanguage();
    try {
        const eventParticipant = await prisma.eventParticipant.findUniqueOrThrow({
            where: {
                id: validatedEventParticipantId,
            },
            include: {
                ticket: {
                    include: {
                        event: {
                            include: {
                                tasks: {
                                    where: {
                                        assignee_id: loggedInUser!.id,
                                    },
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                    },
                },
                user: { select: { id: true, nickname: true } },
            },
        });

        const isEventHost = eventParticipant.ticket.event.host_id === loggedInUser!.id;
        const isVolunteer = eventParticipant.ticket.event.tasks.length || 0 > 0;

        if (!(isUserAdmin(loggedInUser) || isEventHost || isVolunteer))
            return LanguageTranslations.unauthorized[language];

        if (eventParticipant.checked_in_at) {
            // Consider already checked in if checked_in_at is set and is before now minus 10 seconds (to account for small delays)
            if (
                dayjs
                    .utc(eventParticipant.checked_in_at)
                    .isBefore(dayjs.utc().subtract(10, "seconds"))
            )
                return (
                    LanguageTranslations.alreadyCheckedIn[language] +
                    " " +
                    formatUtcDateToTimezone(eventParticipant.checked_in_at)
                );
            return;
        }

        // Dont check in if not within one hour of event opening hours
        const now = dayjs.utc();
        const eventStart = dayjs.utc(eventParticipant.ticket.event.start_time);
        const eventEnd = dayjs.utc(eventParticipant.ticket.event.end_time);
        if (now.isBefore(eventStart.subtract(1, "hour")) || now.isAfter(eventEnd.add(1, "hour"))) {
            return;
        }

        await prisma.eventParticipant.update({
            where: {
                id: validatedEventParticipantId,
            },
            data: {
                checked_in_at: new Date(),
            },
        });

        revalidateTag(await getEventParticipantByIdCacheTag(validatedEventParticipantId), "max");
        revalidateTag(await getEventParticipantCacheTag(eventParticipant.ticket.event_id), "max");
        revalidateTag(await getUserEventParticipantsCacheTag(eventParticipant.user_id), "max");
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === prismaErrorCodes.resultNotFound
        ) {
            return LanguageTranslations.eventParticipantNotFound[language];
        }
        console.error("Unknown Prisma error during check-in:", error);
    }
};
