"use server";
import { prisma } from "../../../prisma/prisma-client";
import { notifyEventReserves } from "./mail-service/mail-service";

export const addEventParticipant = async (userId: string, ticketId: string) => {
    try {
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
                    userId: userId,
                    eventId: ticket.eventId,
                },
            });

            // Decrement the product stock of all tickets with limited stock belonging to the same event
            // Ticket product stock reflects the total number of available tickets across all types
            await tx.product.updateMany({
                where: {
                    ticket: {
                        eventId: ticket.eventId,
                    },
                    NOT: {
                        unlimitedStock: true,
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
    } catch {
        throw new Error("Failed to add event participant");
    }
};

export const deleteEventParticipant = async (eventId: string, userId: string) => {
    try {
        // Find the ticket the user holds to the event
        const ticket = await prisma.ticket.findFirstOrThrow({
            where: {
                eventId: eventId,
                eventParticipants: {
                    some: {
                        userId: userId,
                    },
                },
            },
        });
        const deleteParticipantPromise = prisma.eventParticipant.delete({
            where: {
                userId_ticketId: {
                    userId,
                    ticketId: ticket.id,
                },
            },
        });
        // Increment the product stock of all tickets with limited stock belonging to the same event
        // Ticket product stock reflects the total number of available tickets across all types
        const incrementTicketStockPromise = prisma.product.updateMany({
            where: {
                ticket: {
                    eventId,
                },
                NOT: {
                    unlimitedStock: true,
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
    } catch {
        throw new Error("Failed to delete event participant");
    }

    try {
        await notifyEventReserves(eventId);
    } catch {
        throw new Error("Failed to notify event reserves");
    }
};

export const getEventParticipantEmails = async (eventId: string): Promise<string[]> => {
    try {
        const participants = await prisma.eventParticipant.findMany({
            where: { ticket: { eventId } },
            select: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        return participants.map((participant) => participant.user.email);
    } catch {
        throw new Error("Failed to get event participant emails");
    }
};
