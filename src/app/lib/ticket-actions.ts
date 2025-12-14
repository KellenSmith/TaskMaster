"use server";

import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { ProductCreateSchema, TicketWithoutRelationsSchema, UuidSchema } from "./zod-schemas";
import { prisma } from "../../../prisma/prisma-client";

export const createEventTicket = async (eventId: string, formData: FormData) => {
    // Validate event ID format
    const validatedEventId = UuidSchema.parse(eventId);
    // Revalidate input with zod schema - don't trust the client
    const formDataObject = Object.fromEntries(formData.entries());

    const ticketFieldValues = TicketWithoutRelationsSchema.parse(formDataObject);
    const productFieldValues = ProductCreateSchema.parse(formDataObject);

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
    revalidateTag(GlobalConstants.TICKET, "max");
};

export const updateEventTicket = async (ticketId: string, formData: FormData) => {
    // Validate event ID format
    const validatedTicketId = UuidSchema.parse(ticketId);
    // Revalidate input with zod schema - don't trust the client
    const formDataObject = Object.fromEntries(formData.entries());

    const ticketFieldValues = TicketWithoutRelationsSchema.parse(formDataObject);
    const productFieldValues = ProductCreateSchema.parse(formDataObject);
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
    revalidateTag(GlobalConstants.TICKET, "max");
};

export const deleteEventTicket = async (ticketId: string) => {
    // Validate ticket ID format
    const validatedTicketId = UuidSchema.parse(ticketId);
    await prisma.product.delete({
        where: {
            id: validatedTicketId,
        },
    });
    revalidateTag(GlobalConstants.TICKET, "max");
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
