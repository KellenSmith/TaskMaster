"use server";

import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import {
    ProductCreateSchema,
    ProductUpdateSchema,
    TicketCreateSchema,
    TicketUpdateSchema,
    TicketWithoutRelationsSchema,
} from "./zod-schemas";
import { prisma } from "../../../prisma/prisma-client";
import z from "zod";

export const createEventTicket = async (
    eventId: string,
    parsedFieldValues: z.infer<typeof TicketCreateSchema>,
) => {
    try {
        const ticketFieldValues = TicketWithoutRelationsSchema.parse(parsedFieldValues);
        const productFieldValues = ProductCreateSchema.parse(parsedFieldValues);

        // Find the number of participants in the event
        const eventParticipantsCount = await prisma.eventParticipant.count({
            where: {
                ticket: {
                    eventId,
                },
            },
        });
        const event = await prisma.event.findFirstOrThrow({
            where: {
                id: eventId,
            },
            select: { maxParticipants: true },
        });

        await prisma.ticket.create({
            data: {
                ...ticketFieldValues,
                product: {
                    create: {
                        ...productFieldValues,
                        stock: event.maxParticipants - eventParticipantsCount,
                    },
                },
                event: {
                    connect: {
                        id: eventId,
                    },
                },
            },
        });
        revalidateTag(GlobalConstants.TICKET);
    } catch {
        throw new Error("Failed to create event ticket");
    }
};

export const updateEventTicket = async (
    ticketId: string,
    parsedFieldValues: z.infer<typeof TicketUpdateSchema>,
) => {
    try {
        const ticketFieldValues = TicketWithoutRelationsSchema.parse(parsedFieldValues);
        const productFieldValues = ProductUpdateSchema.parse(parsedFieldValues);
        await prisma.ticket.update({
            where: {
                id: ticketId,
            },
            data: {
                ...ticketFieldValues,
                product: {
                    update: {
                        ...productFieldValues,
                    },
                },
            },
        });
        revalidateTag(GlobalConstants.TICKET);
    } catch {
        throw new Error("Failed to update event ticket");
    }
};

export const deleteEventTicket = async (ticketId: string) => {
    try {
        const deleteTicket = prisma.ticket.delete({
            where: {
                id: ticketId,
            },
        });
        const deleteProduct = prisma.product.delete({
            where: {
                id: ticketId,
            },
        });
        await prisma.$transaction([deleteTicket, deleteProduct]);
        revalidateTag(GlobalConstants.TICKET);
    } catch {
        throw new Error("Failed to delete event ticket");
    }
};

export const getEventTickets = async (eventId: string) => {
    try {
        return await prisma.ticket.findMany({
            where: {
                eventId,
            },
            include: {
                product: true,
                eventParticipants: true,
            },
        });
    } catch {
        throw new Error("Failed to fetch event tickets");
    }
};
