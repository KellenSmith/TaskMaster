"use server";

import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import {
    ProductCreateSchema,
    ProductUpdateSchema,
    TicketCreateSchema,
    TicketUpdateSchema,
    TicketWithoutRelationsSchema,
    UuidSchema,
} from "./zod-schemas";
import { prisma } from "../../../prisma/prisma-client";

export const createEventTicket = async (eventId: string, formData: FormData) => {
    // Validate event ID format
    const validatedEventId = UuidSchema.parse(eventId);
    // Revalidate input with zod schema - don't trust the client
    const validatedData = TicketCreateSchema.parse(Object.fromEntries(formData.entries()));

    const ticketFieldValues = TicketWithoutRelationsSchema.parse(validatedData);
    const productFieldValues = ProductCreateSchema.parse(validatedData);

    // Find the number of participants in the event
    const eventParticipantsCount = await prisma.eventParticipant.count({
        where: {
            ticket: {
                event_id: validatedEventId,
            },
        },
    });
    const event = await prisma.event.findFirstOrThrow({
        where: {
            id: validatedEventId,
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
                    id: validatedEventId,
                },
            },
        },
    });
    revalidateTag(GlobalConstants.TICKET);
};

export const updateEventTicket = async (ticketId: string, formData: FormData) => {
    // Validate ticket ID format
    const validatedTicketId = UuidSchema.parse(ticketId);
    // Revalidate input with zod schema - don't trust the client
    const validatedData = TicketUpdateSchema.parse(Object.fromEntries(formData.entries()));

    const ticketFieldValues = TicketWithoutRelationsSchema.parse(validatedData);
    const productFieldValues = ProductUpdateSchema.parse(validatedData);
    await prisma.ticket.update({
        where: {
            product_id: validatedTicketId,
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
    // Validate ticket ID format
    const validatedTicketId = UuidSchema.parse(ticketId);

    await prisma.$transaction(async (tx) => {
        const deletedTicket = await tx.ticket.delete({
            where: {
                product_id: validatedTicketId,
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
    // Validate event ID format
    const validatedEventId = UuidSchema.parse(eventId);

    return await prisma.ticket.findMany({
        where: {
            event_id: validatedEventId,
        },
        include: {
            product: true,
            event_participants: true,
        },
    });
};
