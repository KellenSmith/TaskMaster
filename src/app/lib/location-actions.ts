"use server";

import { Location } from "@prisma/client";
import z from "zod";
import { LocationCreateSchema, LocationUpdateSchema } from "./zod-schemas";
import { prisma } from "../../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";

export const getAllLocations = async (): Promise<Location[]> => {
    return await prisma.location.findMany();
};

export const createLocation = async (
    parsedFieldValues: z.infer<typeof LocationCreateSchema>,
): Promise<Location> => {
    try {
        const location = await prisma.location.create({ data: parsedFieldValues });
        revalidateTag(GlobalConstants.LOCATION);
        return location;
    } catch {
        throw new Error("Failed creating location");
    }
};

export const updateLocation = async (
    locationId: string,
    parsedFieldValues: z.infer<typeof LocationUpdateSchema>,
): Promise<void> => {
    await prisma.location.update({ where: { id: locationId }, data: parsedFieldValues });
    revalidateTag(GlobalConstants.LOCATION);
    revalidateTag(GlobalConstants.EVENT);
};

export const deleteLocation = async (locationId: string): Promise<void> => {
    try {
        await prisma.location.delete({ where: { id: locationId } });
        revalidateTag(GlobalConstants.LOCATION);
        revalidateTag(GlobalConstants.EVENT);
    } catch {
        throw new Error(`Failed deleting location ${locationId}`);
    }
};
