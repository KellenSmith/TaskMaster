"use server";

import { EventStatus, Prisma, TicketType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../prisma/prisma-client";
import {
    EventCreateSchema,
    ProductCreateSchema,
    TicketCreateSchema,
    TicketWithoutProductSchema,
} from "./zod-schemas";
import { informOfCancelledEvent } from "./mail-service/mail-service";
import { getLoggedInUser } from "./user-actions";
import GlobalConstants from "../GlobalConstants";
import { FormActionState } from "./definitions";
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
                        Product: {
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
    } catch (error) {
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
                Product: {
                    create: {
                        ...productFieldValues,
                        stock: event.maxParticipants - event.participantUsers.length,
                    },
                },
                Event: {
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

export const getAllEvents = async (): Promise<Prisma.EventGetPayload<true>[]> => {
    try {
        const events = await prisma.event.findMany();
        return events;
    } catch (error) {
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
        include: { User: { select: { id: true; nickname: true } } };
    }>[]
> => {
    try {
        const participants = await prisma.participantInEvent.findMany({
            where: {
                eventId: eventId,
            },
            include: {
                User: {
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
        include: { User: { select: { id: true; nickname: true } } };
    }>[]
> => {
    try {
        const reserves = await prisma.reserveInEvent.findMany({
            where: {
                eventId: eventId,
            },
            include: {
                User: {
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
    currentActionState: FormActionState,
    fieldValues: Prisma.EventUpdateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };

    try {
        await prisma.event.update({
            where: { id: eventId },
            data: fieldValues,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Updated successfully`;
        revalidateTag(GlobalConstants.EVENT_ID);
        revalidateTag(GlobalConstants.EVENT);
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const cancelEvent = async (
    eventId: string,
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };

    try {
        await prisma.event.update({
            where: { id: eventId },
            data: { status: EventStatus.cancelled } as Prisma.EventUpdateInput,
        });
        await informOfCancelledEvent(eventId);
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Cancelled event and informed participants`;
        revalidateTag(GlobalConstants.EVENT_ID);
        revalidateTag(GlobalConstants.EVENT);
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const deleteEvent = async (eventId: string, currentActionState: FormActionState) => {
    const newActionState = { ...currentActionState };

    try {
        await prisma.$transaction([
            prisma.reserveInEvent.deleteMany({
                where: { eventId },
            }),
            prisma.participantInEvent.deleteMany({
                where: { eventId },
            }),
            prisma.event.delete({
                where: { id: eventId },
            }),
        ]);
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Deleted event, participants and reserve list`;
        revalidateTag(GlobalConstants.EVENT);
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const addEventReserve = async (
    userId: string,
    eventId: string,
    currentActionState: FormActionState,
) => {
    const newActionState = { ...currentActionState };

    try {
        await prisma.reserveInEvent.create({
            data: {
                userId: userId,
                eventId: eventId,
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Successfully added to reserve list`;
        revalidateTag(GlobalConstants.RESERVE_USERS);
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const deleteEventParticipant = async (
    userId: string,
    eventId: string,
    currentActionState: FormActionState,
) => {
    const newActionState = { ...currentActionState };

    try {
        await prisma.participantInEvent.deleteMany({
            where: {
                AND: [{ userId: userId }, { eventId: eventId }],
            } as Prisma.ParticipantInEventWhereInput,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Removed user ${userId} from event ${eventId} participants`;
        revalidateTag(GlobalConstants.PARTICIPANT_USERS);
    } catch (error) {
        console.error(error);
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const deleteEventReserve = async (
    userId: string,
    eventId: string,
    currentActionState: FormActionState,
) => {
    const newActionState = { ...currentActionState };

    try {
        await prisma.reserveInEvent.deleteMany({
            where: {
                AND: [{ userId: userId }, { eventId: eventId }],
            } as Prisma.ReserveInEventWhereInput,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Removed user ${userId} from event ${eventId} reserves`;
        revalidateTag(GlobalConstants.RESERVE_USERS);
    } catch (error) {
        console.error(error);
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const getEventTickets = async (eventId: string) => {
    try {
        return await prisma.ticket.findMany({
            where: {
                eventId,
            },
            include: {
                Product: true,
            },
        });
    } catch (error) {
        throw new Error("Failed to fetch event tickets");
    }
};
