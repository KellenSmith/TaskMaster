"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import GlobalConstants from "../GlobalConstants";
import { getStrippedFormData } from "./action-utils";
import { createEventSchema } from "./event-schema";

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
