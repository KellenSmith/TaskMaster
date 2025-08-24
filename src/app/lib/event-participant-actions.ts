"use server";
import { prisma } from "../../../prisma/prisma-client";

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
                    event: {
                        connect: {
                            id: ticket.eventId,
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
        const deleteParticipantPromise = prisma.eventParticipant.delete({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
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
        // TODO: notify people on the reserve list

        await prisma.$transaction([deleteParticipantPromise, incrementTicketStockPromise]);
        // Don't revalidate the event participants since they are not cached
    } catch (error) {
        console.log(error);
        throw new Error("Failed to delete event participant");
    }
};
