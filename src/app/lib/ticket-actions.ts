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
    const ticketFieldValues = TicketWithoutRelationsSchema.parse(parsedFieldValues);
    const productFieldValues = ProductCreateSchema.parse(parsedFieldValues);

    // Find the number of participants in the event
    const eventParticipantsCount = await prisma.eventParticipant.count({
        where: {
            ticket: {
                event_id: eventId,
            },
        },
    });
    const event = await prisma.event.findFirstOrThrow({
        where: {
            id: eventId,
        },
        select: { max_participants: true },
    });

    await prisma.ticket.create({
        data: {
            ...ticketFieldValues,
            product: {
                create: {
                    ...productFieldValues,
                    stock: event.max_participants - eventParticipantsCount,
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
};

export const updateEventTicket = async (
    ticketId: string,
    parsedFieldValues: z.infer<typeof TicketUpdateSchema>,
) => {
    const ticketFieldValues = TicketWithoutRelationsSchema.parse(parsedFieldValues);
    const productFieldValues = ProductUpdateSchema.parse(parsedFieldValues);
    await prisma.ticket.update({
        where: {
            product_id: ticketId,
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
};

export const deleteEventTicket = async (ticketId: string) => {
    await prisma.$transaction(async (tx) => {
        const deletedTicket = await tx.ticket.delete({
            where: {
                product_id: ticketId,
            },
        });
        await tx.product.delete({
            where: {
                id: deletedTicket.product_id,
            },
        });
    });
    revalidateTag(GlobalConstants.TICKET);
};

export const getEventTickets = async (eventId: string) => {
    return await prisma.ticket.findMany({
        where: {
            event_id: eventId,
        },
        include: {
            product: true,
            event_participants: true,
        },
    });
};
