"use server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import { notifyEventReserves } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { Prisma } from "@prisma/client";

export const addEventParticipant = async (userId: string, ticketId: string) => {
    await prisma.$transaction(async (tx) => {
        const ticket = await prisma.ticket.findUniqueOrThrow({
            where: {
                id: ticketId,
            },
        });

        // Delete the event reserve entry if it exists (within transaction)
        // DON'T USE THE deleteEventReserve FUNCTION
        await tx.eventReserve.deleteMany({
            where: {
                user_id: userId,
                event_id: ticket.event_id,
            },
        });

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
                        id: ticketId,
                    },
                },
            },
        });
    });
    revalidateTag(GlobalConstants.PARTICIPANT_USERS);
    revalidateTag(GlobalConstants.EVENT);
    revalidateTag(GlobalConstants.TICKET);
};

export const deleteEventParticipant = async (eventId: string, userId: string) => {
    // Find the ticket the user holds to the event
    const ticket = await prisma.ticket.findFirstOrThrow({
        where: {
            event_id: eventId,
            event_participants: {
                some: {
                    user_id: userId,
                },
            },
        },
    });
    const deleteParticipantPromise = prisma.eventParticipant.delete({
        where: {
            user_id_ticket_id: {
                user_id: userId,
                ticket_id: ticket.id,
            },
        },
    });
    // Increment the product stock of all tickets with limited stock belonging to the same event
    // Ticket product stock reflects the total number of available tickets across all types
    const incrementTicketStockPromise = prisma.product.updateMany({
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

    // TODO: unassign from tasks happening during the event

    await prisma.$transaction([deleteParticipantPromise, incrementTicketStockPromise]);
    revalidateTag(GlobalConstants.PARTICIPANT_USERS);
    revalidateTag(GlobalConstants.EVENT);
    revalidateTag(GlobalConstants.TICKET);
    await notifyEventReserves(eventId);
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
