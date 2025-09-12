"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { UuidSchema } from "./zod-schemas";
import { Prisma } from "@prisma/client";

export const addEventReserveWithTx = async (
    tx: Prisma.TransactionClient,
    userId: string,
    eventId: string,
) => {
    // Validate ID formats
    const validatedUserId = UuidSchema.parse(userId);
    const validatedEventId = UuidSchema.parse(eventId);

    // Check that the user is not on the participant list
    const eventParticipant = await tx.eventParticipant.findFirst({
        where: {
            user_id: validatedUserId,
            ticket: {
                event_id: validatedEventId,
            },
        },
    });
    if (eventParticipant) throw new Error("User is already a participant in the event");

    await tx.eventReserve.upsert({
        where: {
            user_id_event_id: {
                user_id: validatedUserId,
                event_id: validatedEventId,
            },
        },
        create: {
            user: {
                connect: {
                    id: validatedUserId,
                },
            },
            event: {
                connect: {
                    id: validatedEventId,
                },
            },
        },
        update: {},
    });
    revalidateTag(GlobalConstants.RESERVE_USERS);
    // Event reserves with limited data is cached with the event
    revalidateTag(GlobalConstants.EVENT);
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
    // Validate ID formats
    const validatedUserId = UuidSchema.parse(userId);
    const validatedEventId = UuidSchema.parse(eventId);

    // Delete the event reserve entry if it exists (use deleteMany to avoid error)
    await tx.eventReserve.deleteMany({
        where: {
            user_id: validatedUserId,
            event_id: validatedEventId,
        },
    });
    revalidateTag(GlobalConstants.RESERVE_USERS);
    // Event reserves with limited data is cached with the event
    revalidateTag(GlobalConstants.EVENT);
};

export const deleteEventReserve = async (userId: string, eventId: string) => {
    // Validate ID formats
    const validatedUserId = UuidSchema.parse(userId);
    const validatedEventId = UuidSchema.parse(eventId);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await deleteEventReserveWithTx(tx, validatedUserId, validatedEventId);
    });
};

export const getEventReserves = async (eventId: string) => {
    // Validate event ID format
    const validatedEventId = UuidSchema.parse(eventId);

    return await prisma.eventReserve.findMany({
        where: { event_id: validatedEventId },
        include: {
            user: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
        },
    });
};

export const getEventReservesEmails = async (eventId: string): Promise<string[]> => {
    // Validate event ID format
    const validatedEventId = UuidSchema.parse(eventId);

    const reserves = await prisma.eventReserve.findMany({
        where: { event_id: validatedEventId },
        select: {
            user: {
                select: {
                    email: true,
                },
            },
        },
    });
    return reserves.map((reserve) => reserve.user.email);
};
