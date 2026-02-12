"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { UuidSchema } from "./zod-schemas";
import { Prisma } from "@/prisma/generated/client";

export const addEventReserveWithTx = async (
    tx: Prisma.TransactionClient,
    userId: string,
    eventId: string,
) => {
    // Check that the user is not on the participant list
    const eventParticipant = await tx.eventParticipant.findFirst({
        where: {
            user_id: userId,
            ticket: {
                event_id: eventId,
            },
        },
    });
    if (eventParticipant) throw new Error("User is already a participant in the event");

    await tx.eventReserve.upsert({
        where: {
            user_id_event_id: {
                user_id: userId,
                event_id: eventId,
            },
        },
        create: {
            user: {
                connect: {
                    id: userId,
                },
            },
            event: {
                connect: {
                    id: eventId,
                },
            },
        },
        update: {},
    });
    revalidateTag(GlobalConstants.RESERVE_USERS, "max");
    // Event reserves with limited data is cached with the event
    revalidateTag(GlobalConstants.EVENT, "max");
};

export const addEventReserve = async (userId: string, eventId: string): Promise<void> => {
    // Validate ID formats
    const validatedUserId = UuidSchema.parse(userId);
    const validatedEventId = UuidSchema.parse(eventId);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await addEventReserveWithTx(tx, validatedUserId, validatedEventId);
    });
};

export const deleteEventReserveWithTx = async (
    tx: Prisma.TransactionClient,
    userId: string,
    eventId: string,
) => {
    // Delete the event reserve entry if it exists (use deleteMany to avoid error)
    await tx.eventReserve.deleteMany({
        where: {
            user_id: userId,
            event_id: eventId,
        },
    });
    revalidateTag(GlobalConstants.RESERVE_USERS, "max");
    // Event reserves with limited data is cached with the event
    revalidateTag(GlobalConstants.EVENT, "max");
};

export const deleteEventReserve = async (userId: string, eventId: string) => {
    // Validate ID formats
    const validatedUserId = UuidSchema.parse(userId);
    const validatedEventId = UuidSchema.parse(eventId);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await deleteEventReserveWithTx(tx, validatedUserId, validatedEventId);
    });
};
