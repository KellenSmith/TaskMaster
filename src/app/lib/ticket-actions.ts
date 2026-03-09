"use server";

import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { ProductCreateSchema, TicketWithoutRelationsSchema, UuidSchema } from "./zod-schemas";
import { prisma } from "../../prisma/prisma-client";
import { deleteOldBlob } from "./organization-settings-actions";

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

    const oldProduct = await prisma.product.findUniqueOrThrow({
        where: { id: validatedTicketId },
    });

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

    // Delete old blob if image_url was provided in the update and differs from the old one
    if (GlobalConstants.IMAGE_URL in productFieldValues)
        await deleteOldBlob(oldProduct.image_url, productFieldValues.image_url);

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
