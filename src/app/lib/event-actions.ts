"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import { getStrippedFormData } from "./action-utils";
import { createEventSchema } from "./event-schema";
import { DatagridActionState } from "../ui/Datagrid";

export const createEvent = async (
    hostId: string,
    currentActionState: FormActionState,
    formData: FormData,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    // Get props in formData which are part of the event schema
    const parsedFormData = getStrippedFormData(formData, createEventSchema);

    try {
        const createdEvent = await prisma.event.create({
            data: {
                hostId: hostId,
                ...parsedFormData,
            } as Prisma.EventCreateInput,
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
                        userId: true,
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
    formData: FormData,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };

    const strippedFormData = getStrippedFormData(
        formData,
        createEventSchema,
    ) as Prisma.UserUpdateInput;

    try {
        await prisma.event.update({
            where: { id: eventId } as Prisma.EventWhereUniqueInput,
            data: strippedFormData,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Updated successfully`;
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
        await prisma.event.delete({
            where: { id: eventId } as Prisma.EventWhereUniqueInput,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Deleted event`;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const addEventParticipant = async (
    userId: string,
    eventId: string,
    currentActionState: FormActionState,
) => {
    const newActionState = { ...currentActionState };

    try {
        await prisma.participantInEvent.create({
            data: {
                userId: userId,
                eventId: eventId,
            },
            include: {
                Event: true,
                User: true,
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `See you there!`;
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
            include: {
                Event: true,
                User: true,
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Successfully added to reserve list`;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};
