"use server";

import { Location } from "@prisma/client";
import z from "zod";
import { LocationCreateSchema, LocationUpdateSchema, UuidSchema } from "./zod-schemas";
import { prisma } from "../../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { sanitizeFormData } from "./html-sanitizer";

export const getAllLocations = async (): Promise<Location[]> => {
    return await prisma.location.findMany();
};

export const createLocation = async (
    parsedFieldValues: z.infer<typeof LocationCreateSchema>,
): Promise<Location> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = LocationCreateSchema.parse(parsedFieldValues);

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    const location = await prisma.location.create({ data: sanitizedData });
    revalidateTag(GlobalConstants.LOCATION);
    return location;
};

export const updateLocation = async (
    locationId: string,
    parsedFieldValues: z.infer<typeof LocationUpdateSchema>,
): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = LocationUpdateSchema.parse(parsedFieldValues);

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    await prisma.location.update({ where: { id: locationId }, data: sanitizedData });
    revalidateTag(GlobalConstants.LOCATION);
    revalidateTag(GlobalConstants.EVENT);
};

export const deleteLocation = async (locationId: string): Promise<void> => {
    // Validate location ID format
    const validatedLocationId = UuidSchema.parse(locationId);

    await prisma.location.delete({ where: { id: validatedLocationId } });
    revalidateTag(GlobalConstants.LOCATION);
    revalidateTag(GlobalConstants.EVENT);
};
