"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import GlobalConstants from "../GlobalConstants";
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
                [GlobalConstants.HOST_ID]: hostId,
                ...parsedFormData,
            } as Prisma.EventUncheckedCreateInput,
        });
        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = `Event #${createdEvent[GlobalConstants.ID]} ${
            createdEvent[GlobalConstants.TITLE]
        } created successfully`;
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
        const events: Prisma.EventUncheckedCreateInput[] = await prisma.event.findMany();
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
        const event = await prisma.event.findUnique({
            where: {
                [GlobalConstants.ID]: eventId,
            } as any as Prisma.EventWhereUniqueInput,
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
            where: { [GlobalConstants.ID]: eventId } as any as Prisma.EventWhereUniqueInput,
            data: strippedFormData,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = `Updated successfully`;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = null;
    }
    return newActionState;
};
