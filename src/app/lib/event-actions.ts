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

export const createEvent = async (
    parsedFieldValues: z.infer<typeof EventCreateSchema>,
): Promise<void> => {
    let createdEventId: string;

    try {
        const loggedInUser = await getLoggedInUser();
        const createdEvent = await prisma.event.create({
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
                                stock: parsedFieldValues.maxParticipants,
                            },
                        },
                    },
                },
            },
            include: {
                tickets: true,
            },
        });

        // Add the host as a participant with the volunteer ticket
        const volunteerTicket = createdEvent.tickets.find(
            (ticket) => ticket.type === TicketType.volunteer,
        );
        if (volunteerTicket) {
            await prisma.participantInEvent.create({
                data: {
                    userId: loggedInUser.id,
                    eventId: createdEvent.id,
                    ticketId: volunteerTicket.id,
                },
            });
        }

        createdEventId = createdEvent.id;
        revalidateTag(GlobalConstants.EVENT);
    } catch {
        throw new Error("Failed to create event");
    }
    createdEventId &&
        redirect(
            new NextURL(
                `/${GlobalConstants.EVENT}?eventId=${createdEventId}`,
                process.env.VERCEL_URL,
            ).toString(),
        );
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
            host: { select: { id: true; nickname: true } };
            participantUsers: { include: { user: { select: { id: true; nickname: true } } } };
            reserveUsers: { include: { user: { select: { id: true; nickname: true } } } };
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
                        nickname: true,
                    },
                },
                participantUsers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                nickname: true,
                            },
                        },
                    },
                },
                reserveUsers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                nickname: true,
                            },
                        },
                    },
                },
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
    Prisma.EventGetPayload<{ include: { host: { select: { id: true; nickname: true } } } }>
> => {
    try {
        return await prisma.event.findUniqueOrThrow({
            where: {
                id: eventId,
            },
            include: {
                host: {
                    select: {
                        id: true,
                        nickname: true,
                    },
                },
            },
        });
    } catch {
        throw new Error("Failed to fetch event");
    }
};

export const getEventParticipants = async (
    eventId: string,
): Promise<
    Prisma.ParticipantInEventGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[]
> => {
    try {
        const participants = await prisma.participantInEvent.findMany({
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
        return participants;
    } catch {
        throw new Error("Failed to fetch event participants");
    }
};

export const getEventReserves = async (
    eventId: string,
): Promise<
    Prisma.ReserveInEventGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[]
> => {
    try {
        const reserves = await prisma.reserveInEvent.findMany({
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
                participantUsers: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        const onlyHostIsParticipating =
            event.participantUsers.length === 1 &&
            event.participantUsers[0].userId === event.hostId;

        if (!onlyHostIsParticipating)
            throw new Error(
                "The event has participants and cannot be deleted. Cancel the event instead",
            );

        await prisma.$transaction([
            prisma.reserveInEvent.deleteMany({
                where: { eventId },
            }),
            prisma.participantInEvent.deleteMany({
                where: { eventId },
            }),
            prisma.ticket.deleteMany({
                where: { eventId },
            }),
            prisma.event.delete({
                where: { id: eventId },
            }),
        ]);
        revalidateTag(GlobalConstants.EVENT);
    } catch (error) {
        console.log(error.message);
        throw new Error("Failed to delete event");
    }
};

export const addEventReserve = async (userId: string, eventId: string): Promise<void> => {
    try {
        await prisma.reserveInEvent.create({
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

export const deleteEventParticipant = async (userId: string, eventId: string): Promise<void> => {
    try {
        await prisma.participantInEvent.deleteMany({
            where: {
                AND: [{ userId: userId }, { eventId: eventId }],
            } as Prisma.ParticipantInEventWhereInput,
        });
        revalidateTag(GlobalConstants.PARTICIPANT_USERS);
    } catch {
        throw new Error("Failed to remove user from event participants");
    }
};

export const deleteEventReserve = async (userId: string, eventId: string): Promise<void> => {
    try {
        await prisma.reserveInEvent.deleteMany({
            where: {
                AND: [{ userId: userId }, { eventId: eventId }],
            } as Prisma.ReserveInEventWhereInput,
        });
        revalidateTag(GlobalConstants.RESERVE_USERS);
    } catch (error) {
        console.error(error);
        throw new Error("Failed to delete event reserve");
    }
};
