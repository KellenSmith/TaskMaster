import { z } from "zod";
import GlobalConstants from "../GlobalConstants";

export const createEventSchema = z.object({
    [GlobalConstants.TITLE]: z.string(),
    [GlobalConstants.LOCATION]: z.string(),
    [GlobalConstants.START_TIME]: z.coerce.date(),
    [GlobalConstants.END_TIME]: z.coerce.date(),
    [GlobalConstants.MAX_PARTICIPANTS]: z.coerce.number(),
    [GlobalConstants.FULL_TICKET_PRICE]: z.coerce.number(),
    [GlobalConstants.DESCRIPTION]: z.string(),
});
