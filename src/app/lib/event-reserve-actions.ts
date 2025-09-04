"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";

export const addEventReserveWithTx = async (tx, userId: string, eventId: string) => {
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
    revalidateTag(GlobalConstants.RESERVE_USERS);
    // Event reserves with limited data is cached with the event
    revalidateTag(GlobalConstants.EVENT);
};

export const addEventReserve = async (userId: string, eventId: string): Promise<void> => {
    await prisma.$transaction(async (tx) => {
        await addEventReserveWithTx(tx, userId, eventId);
    });
};

export const deleteEventReserveWithTx = async (tx, userId: string, eventId: string) => {
    // Delete the event reserve entry if it exists (use deleteMany to avoid error)
    await tx.eventReserve.deleteMany({
        where: {
            user_id: userId,
            event_id: eventId,
        },
    });
    revalidateTag(GlobalConstants.RESERVE_USERS);
    // Event reserves with limited data is cached with the event
    revalidateTag(GlobalConstants.EVENT);
};

export const deleteEventReserve = async (userId: string, eventId: string) => {
    await prisma.$transaction(async (tx) => {
        await deleteEventReserveWithTx(tx, userId, eventId);
    });
};

export const getEventReserves = async (eventId: string) => {
    return await prisma.eventReserve.findMany({
        where: { event_id: eventId },
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
    const reserves = await prisma.eventReserve.findMany({
        where: { event_id: eventId },
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
