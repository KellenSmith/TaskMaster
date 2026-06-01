"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { UuidSchema } from "./zod-schemas";
import { Prisma } from "../../prisma/generated/client";
import { connection } from "next/server";

export const getEventReservesCacheTag = async (eventId: string) =>
    `${GlobalConstants.RESERVE_USERS}:event:${eventId}`;

export const getUserEventReservesCacheTag = async (userId: string) =>
    `${GlobalConstants.RESERVE_USERS}:user:${userId}`;

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
    revalidateTag(await getEventReservesCacheTag(eventId), "max");
    revalidateTag(await getUserEventReservesCacheTag(userId), "max");
};

export const addEventReserve = async (userId: string, eventId: string): Promise<void> => {
    // Validate ID formats
    const validatedUserId = UuidSchema.parse(userId);
    const validatedEventId = UuidSchema.parse(eventId);

    await connection();
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await addEventReserveWithTx(tx, validatedUserId, validatedEventId);
    });

    revalidateTag(await getEventReservesCacheTag(eventId), "max");
    revalidateTag(await getUserEventReservesCacheTag(userId), "max");
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
    revalidateTag(await getEventReservesCacheTag(eventId), "max");
    revalidateTag(await getUserEventReservesCacheTag(userId), "max");
};

export const deleteEventReserve = async (userId: string, eventId: string) => {
    // Validate ID formats
    const validatedUserId = UuidSchema.parse(userId);
    const validatedEventId = UuidSchema.parse(eventId);

    await connection();
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await deleteEventReserveWithTx(tx, validatedUserId, validatedEventId);
    });

    revalidateTag(await getEventReservesCacheTag(eventId), "max");
    revalidateTag(await getUserEventReservesCacheTag(userId), "max");
};
