import { z } from "zod";
import GlobalConstants from "../GlobalConstants";

export const updateEventSchema = z.object({
    [GlobalConstants.ID]: z.string(),
    [GlobalConstants.TITLE]: z.string(),
    [GlobalConstants.LOCATION]: z.string(),
    [GlobalConstants.START_TIME]: z.coerce.date(),
    [GlobalConstants.END_TIME]: z.coerce.date(),
    [GlobalConstants.MAX_PARTICIPANTS]: z.coerce.number(),
    [GlobalConstants.FULL_TICKET_PRICE]: z.coerce.number(),
    [GlobalConstants.DESCRIPTION]: z.string(),
});

export const createEventSchema = updateEventSchema.omit({ [GlobalConstants.ID]: true });

export const updateTaskSchema = z.object({
    [GlobalConstants.ID]: z.string(),
    [GlobalConstants.EVENT_ID]: z.string(),
    [GlobalConstants.ASSIGNEE_ID]: z.string(),
    [GlobalConstants.REPORTER_ID]: z.string(),
    [GlobalConstants.STATUS]: z.string(),
    [GlobalConstants.TAGS]: z.array(z.string()),
    [GlobalConstants.NAME]: z.string(),
    [GlobalConstants.PHASE]: z.string(),
    [GlobalConstants.START_TIME]: z.coerce.date(),
    [GlobalConstants.END_TIME]: z.coerce.date(),
    [GlobalConstants.DESCRIPTION]: z.string(),
});

export const createTaskSchema = updateTaskSchema.omit({
    [GlobalConstants.ID]: true,
    [GlobalConstants.ASSIGNEE_ID]: true,
    [GlobalConstants.REPORTER_ID]: true,
    [GlobalConstants.STATUS]: true,
    [GlobalConstants.PHASE]: true,
    [GlobalConstants.TAGS]: true,
});
