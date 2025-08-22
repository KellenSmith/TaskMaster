"use server";

import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { ProductCreateSchema, TicketCreateSchema, TicketWithoutProductSchema } from "./zod-schemas";
import { prisma } from "../../prisma/prisma-client";
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
        const ticketFieldValues = TicketWithoutProductSchema.parse(parsedFieldValues);
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
        revalidateTag(GlobalConstants.EVENT);
    } catch (error) {
        throw new Error("Failed to create event ticket");
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
    } catch (error) {
        throw new Error("Failed to fetch event tickets");
    }
};
