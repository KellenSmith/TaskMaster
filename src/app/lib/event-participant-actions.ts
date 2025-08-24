"use server";
import { prisma } from "../../../prisma/prisma-client";

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

        await prisma.$transaction([deleteParticipantPromise, incrementTicketStockPromise]);
        // Don't revalidate the event participants since they are not cached
    } catch (error) {
        console.log(error);
        throw new Error("Failed to delete event participant");
    }
};
