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
        const event = await prisma.event.findUniqueOrThrow({
            where: {
                id: eventId,
            },
            include: {
                participantUsers: true,
            },
        });
        const ticketFieldValues = TicketWithoutRelationsSchema.parse(parsedFieldValues);
        const productFieldValues = ProductCreateSchema.parse(parsedFieldValues);

        await prisma.ticket.create({
            data: {
                ...ticketFieldValues,
                product: {
                    create: {
                        ...productFieldValues,
                        stock: event.maxParticipants - event.participantUsers.length,
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
        console.log(
            "ticketFieldValues",
            ticketFieldValues,
            "productFieldValues: ",
            productFieldValues,
        );
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
        const deleteProduct = prisma.product.deleteMany({
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
            },
        });
    } catch {
        throw new Error("Failed to fetch event tickets");
    }
};
