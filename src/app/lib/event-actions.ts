"use server";

import { EventStatus, Prisma, TicketType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../prisma/prisma-client";
import { EventCreateSchema, EventUpdateSchema } from "./zod-schemas";
import { informOfCancelledEvent } from "./mail-service/mail-service";
import { getLoggedInUser } from "./user-actions";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import { NextURL } from "next/dist/server/web/next-url";
import { redirect } from "next/navigation";
import { isUserHost } from "./definitions";
import { allowRedirectException } from "../ui/utils";

export const createEvent = async (
    parsedFieldValues: z.infer<typeof EventCreateSchema>,
): Promise<void> => {
    try {
        const loggedInUser = await getLoggedInUser();
        const createdEvent = await prisma.$transaction(async (tx) => {
            // Create event with ticket
            const createdEvent = await tx.event.create({
                data: {
                    ...parsedFieldValues,
                    host: {
                        connect: {
                            id: loggedInUser.id,
                        },
                    },
                    tickets: {
                        create: {
                            type: TicketType.volunteer,
                            product: {
                                create: {
                                    name: `Volunteer ticket for ${parsedFieldValues.title}`,
                                    description:
                                        "Admittance for one member signed up for at least one volunteer task",
                                    stock: parsedFieldValues.maxParticipants - 1,
                                },
                            },
                        },
                    },
                },
                include: {
                    tickets: true,
                },
            });

            // Create event participant
            const volunteerTicket = createdEvent.tickets[0]; // Since we just created one ticket
            await tx.eventParticipant.create({
                data: {
                    userId: loggedInUser.id,
                    ticketId: volunteerTicket.id,
                },
            });

            return createdEvent;
        });

        revalidateTag(GlobalConstants.EVENT);
        redirect(
            new NextURL(
                `/${GlobalConstants.EVENT}?eventId=${createdEvent.id}`,
                process.env.VERCEL_URL,
            ).toString(),
        );
    } catch (error) {
        allowRedirectException(error);
        throw new Error("Failed to create event");
    }
};

export const getAllEvents = async (): Promise<Prisma.EventGetPayload<true>[]> => {
    try {
        const events = await prisma.event.findMany();
        return events;
    } catch {
        throw new Error("Failed to fetch events");
    }
};

export const getFilteredEvents = async (
    filters: Prisma.EventWhereInput,
): Promise<
    Prisma.EventGetPayload<{
        include: {
            tickets: { include: { eventParticipants: true } };
            eventReserves: true;
        };
    }>[]
> => {
    try {
        const events = await prisma.event.findMany({
            where: filters,
            include: {
                host: {
                    select: {
                        id: true,
                    },
                },
                tickets: {
                    include: {
                        eventParticipants: true,
                    },
                },
                eventReserves: true,
            },
        });
        return events;
    } catch {
        throw new Error("Failed to fetch events");
    }
};

export const getEventById = async (
    eventId: string,
): Promise<
    Prisma.EventGetPayload<{
        include: { tickets: { include: { eventParticipants: true } }; eventReserves: true };
    }>
> => {
    try {
        const event = await prisma.event.findUniqueOrThrow({
            where: {
                id: eventId,
            },
            include: {
                tickets: {
                    include: {
                        eventParticipants: true,
                    },
                },
                eventReserves: true,
            },
        });

        // Only event hosts can see event drafts
        const loggedInUser = await getLoggedInUser();
        if (event.status === EventStatus.draft && !isUserHost(loggedInUser, event)) {
            throw new Error("You are not authorized to view this event");
        }

        return event;
    } catch {
        throw new Error("Failed to fetch event");
    }
};

export const getEventParticipants = async (
    eventId: string,
): Promise<
    Prisma.EventParticipantGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[]
> => {
    try {
        const participants = await prisma.eventParticipant.findMany({
            where: {
                ticket: {
                    eventId: eventId,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nickname: true,
                    },
                },
            },
        });
        return participants;
    } catch {
        throw new Error("Failed to fetch event participants");
    }
};

export const getEventReserves = async (
    eventId: string,
): Promise<
    Prisma.EventReserveGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[]
> => {
    try {
        const reserves = await prisma.eventReserve.findMany({
            where: {
                eventId: eventId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nickname: true,
                    },
                },
            },
        });
        return reserves;
    } catch {
        throw new Error("Failed to fetch event reserves");
    }
};

export const updateEvent = async (
    eventId: string,
    parsedFieldValues: z.infer<typeof EventUpdateSchema>,
): Promise<void> => {
    try {
        await prisma.event.update({
            where: { id: eventId },
            data: parsedFieldValues,
        });
        revalidateTag(GlobalConstants.EVENT);
    } catch {
        throw new Error("Failed to update event");
    }
};

export const cancelEvent = async (eventId: string): Promise<void> => {
    try {
        await updateEvent(eventId, { status: EventStatus.cancelled });
        revalidateTag(GlobalConstants.EVENT);
    } catch {
        throw new Error("Failed to cancel event");
    }
    try {
        await informOfCancelledEvent(eventId);
    } catch (error) {
        throw new Error(error.message);
    }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
    try {
        const event = await prisma.event.findUniqueOrThrow({
            where: { id: eventId },
            include: {
                tickets: {
                    include: {
                        eventParticipants: true,
                    },
                },
            },
        });

        const eventParticipants = await getEventParticipants(eventId);
        const onlyHostIsParticipating =
            eventParticipants.length === 1 && eventParticipants[0].userId === event.hostId;
        if (!onlyHostIsParticipating)
            throw new Error(
                "The event has participants and cannot be deleted. Cancel the event instead",
            );

        await prisma.$transaction([
            prisma.eventReserve.deleteMany({
                where: { eventId },
            }),
            prisma.eventParticipant.deleteMany({
                where: { ticket: { eventId } },
            }),
            prisma.ticket.deleteMany({
                where: { eventId },
            }),
            prisma.event.delete({
                where: { id: eventId },
            }),
        ]);
        revalidateTag(GlobalConstants.EVENT);
    } catch {
        throw new Error("Failed to delete event");
    }
};
