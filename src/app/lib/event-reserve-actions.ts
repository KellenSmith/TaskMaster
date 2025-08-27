"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";

export const addEventReserve = async (userId: string, eventId: string): Promise<void> => {
    try {
        // Check that the user is not on the participant list
        const eventParticipant = await prisma.eventParticipant.findFirst({
            where: {
                userId,
                ticket: {
                    eventId,
                },
            },
        });
        if (eventParticipant) throw new Error("User is already a participant in the event");

        await prisma.eventReserve.create({
            data: {
                userId: userId,
                eventId: eventId,
            },
        });
        revalidateTag(GlobalConstants.RESERVE_USERS);
        // Event reserves with limited data is cached with the event
        revalidateTag(GlobalConstants.EVENT);
    } catch {
        throw new Error("Failed to add user to event reserves");
    }
};

export const deleteEventReserve = async (userId: string, eventId: string) => {
    try {
        // Delete the event reserve entry if it exists
        await prisma.eventReserve.delete({
            where: {
                userId_eventId: {
                    userId: userId,
                    eventId: eventId,
                },
            },
        });
        revalidateTag(GlobalConstants.RESERVE_USERS);
        // Event reserves with limited data is cached with the event
        revalidateTag(GlobalConstants.EVENT);
    } catch {
        throw new Error("Failed to delete event reserve");
    }
};

export const getEventReserves = async (eventId: string) => {
    try {
        return await prisma.eventReserve.findMany({
            where: { eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        nickname: true,
                    },
                },
            },
        });
    } catch {
        throw new Error("Failed to get event reserves");
    }
};

export const getEventReservesEmails = async (eventId: string): Promise<string[]> => {
    try {
        const reserves = await prisma.eventReserve.findMany({
            where: { eventId },
            select: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        return reserves.map((reserve) => reserve.user.email);
    } catch {
        throw new Error("Failed to get event reserves emails");
    }
};
