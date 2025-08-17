"use server";

import { EventStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { createEventSchema } from "./zod-schemas";
import { informOfCancelledEvent } from "./mail-service/mail-service";
import { getLoggedInUser } from "./user-actions";
import GlobalConstants from "../GlobalConstants";
import { DatagridActionState, FormActionState } from "./definitions";
import { revalidatePath } from "next/cache";

export const createEvent = async (
    currentActionState: FormActionState,
    fieldValues: Prisma.EventCreateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };

    try {
        const loggedInUserResult = await getLoggedInUser(currentActionState);
        if (loggedInUserResult.status !== 200) {
            throw new Error("You must be logged in to create an event");
        }
        const loggedInUserId = JSON.parse(loggedInUserResult.result)[GlobalConstants.ID];
        const parsedFieldValues = createEventSchema.parse(fieldValues) as Prisma.EventCreateInput;

        const createdEvent = await prisma.event.create({
            data: {
                ...parsedFieldValues,
                host: {
                    connect: {
                        id: loggedInUserId,
                    },
                },
                tickets: {
                    create: {
                        Product: {
                            create: {
                                name: `Ticket for ${parsedFieldValues.title}`,
                                description: "Admittance for one person",
                                price: parsedFieldValues.fullTicketPrice,
                                unlimitedStock: true,
                            },
                        },
                    },
                },
            },
            include: {
                tickets: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        if (!createdEvent.tickets || createdEvent.tickets.length === 0) {
            throw new Error("Failed to create event ticket");
        }
        await prisma.participantInEvent.create({
            data: {
                userId: loggedInUserId,
                eventId: createdEvent.id,
                ticketId: createdEvent.tickets[0].id,
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = createdEvent.id;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const getAllEvents = async (
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const events = await prisma.event.findMany();
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = events;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const getEventById = async (
    eventId: string,
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const event = await prisma.event.findUniqueOrThrow({
            where: {
                id: eventId,
            } as Prisma.EventWhereUniqueInput,
            include: {
                host: {
                    select: {
                        id: true,
                        nickname: true,
                    },
                },
                participantUsers: {
                    select: {
                        User: {
                            select: {
                                id: true,
                                nickname: true,
                            },
                        },
                    },
                },
                reserveUsers: {
                    select: {
                        userId: true,
                        queueingSince: true,
                    },
                    orderBy: {
                        queueingSince: "asc",
                    },
                },
            },
        });
        newActionState.status = 200;
        newActionState.result = [event];
        newActionState.errorMsg = "";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
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
        revalidatePath(`/calendar/event`);
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
        revalidatePath(`/calendar/event`);
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
        revalidatePath(`/calendar/event`);
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
        revalidatePath(`/calendar/event`);
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
        revalidatePath(`/calendar/event`);
    } catch (error) {
        console.error(error);
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};
