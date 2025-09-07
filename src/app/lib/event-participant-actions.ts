"use server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import { notifyEventReserves } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { Prisma } from "@prisma/client";
import { deleteEventReserveWithTx } from "./event-reserve-actions";

export const addEventParticipantWithTx = async (tx, ticketId: string, userId: string) => {
    const ticket = await prisma.ticket.findUniqueOrThrow({
        where: {
            product_id: ticketId,
        },
    });

    // Check that the event isn't sold out
    const event = await prisma.event.findUniqueOrThrow({
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
    revalidateTag(GlobalConstants.RESERVE_USERS);

    // Decrement the product stock of all tickets with limited stock belonging to the same event
    // Ticket product stock reflects the total number of available tickets across all types
    await tx.product.updateMany({
        where: {
            ticket: {
                event_id: ticket.event_id,
            },
            NOT: {
                unlimited_stock: true,
            },
        },
        data: {
            stock: {
                decrement: 1,
            },
        },
    });
    revalidateTag(GlobalConstants.TICKET);
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
    revalidateTag(GlobalConstants.PARTICIPANT_USERS);
    revalidateTag(GlobalConstants.EVENT);
};

export const addEventParticipant = async (userId: string, ticketId: string) => {
    await prisma.$transaction(async (tx) => {
        await addEventParticipantWithTx(tx, ticketId, userId);
    });
};

export const deleteEventParticipantWithTx = async (tx, eventId: string, userId: string) => {
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
    await tx.eventParticipant.delete({
        where: {
            user_id_ticket_id: {
                user_id: userId,
                ticket_id: ticket.product_id,
            },
        },
    });
    // Increment the product stock of all tickets with limited stock belonging to the same event
    // Ticket product stock reflects the total number of available tickets across all types
    await tx.product.updateMany({
        where: {
            ticket: {
                event_id: eventId,
            },
            NOT: {
                unlimited_stock: true,
            },
        },
        data: {
            stock: {
                increment: 1,
            },
        },
    });

    revalidateTag(GlobalConstants.PARTICIPANT_USERS);
    revalidateTag(GlobalConstants.EVENT);
    revalidateTag(GlobalConstants.TICKET);
    await notifyEventReserves(eventId);
};

export const deleteEventParticipant = async (eventId: string, userId: string) => {
    await prisma.$transaction(async (tx) => {
        await deleteEventParticipantWithTx(tx, eventId, userId);
        await unassignUserFromEventTasks(tx, eventId, userId);
    });
};

export const unassignUserFromEventTasks = async (tx, eventId: string, userId: string) => {
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
            assigned_to: userId,
        },
        data: {
            assignee: {
                disconnect: { id: userId },
            },
        },
    });
};

export const getEventParticipants = async (
    eventId: string,
): Promise<
    Prisma.EventParticipantGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[]
> => {
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

export const getEventParticipantEmails = async (eventId: string): Promise<string[]> => {
    const participants = await prisma.eventParticipant.findMany({
        where: { ticket: { event_id: eventId } },
        select: {
            user: {
                select: {
                    email: true,
                },
            },
        },
    });
    return participants.map((participant) => participant.user.email);
};
