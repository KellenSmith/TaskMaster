"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";

export const addEventReserve = async (userId: string, eventId: string): Promise<void> => {
    try {
        await prisma.eventReserve.create({
            data: {
                userId: userId,
                eventId: eventId,
            },
        });
        revalidateTag(GlobalConstants.RESERVE_USERS);
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
    } catch {
        throw new Error("Failed to delete event reserve");
    }
};
