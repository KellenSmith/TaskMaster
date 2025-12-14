"use server";

import { Location } from "@prisma/client";
import { LocationCreateSchema, LocationUpdateSchema, UuidSchema } from "./zod-schemas";
import { prisma } from "../../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { sanitizeFormData } from "./html-sanitizer";

export const getAllLocations = async (): Promise<Location[]> => {
    return await prisma.location.findMany();
};

export const createLocation = async (formData: FormData): Promise<Location> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = LocationCreateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    const location = await prisma.location.create({ data: sanitizedData });
    revalidateTag(GlobalConstants.LOCATION, "max");
    return location;
};

export const updateLocation = async (locationId: string, formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = LocationUpdateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    await prisma.location.update({ where: { id: locationId }, data: sanitizedData });
    revalidateTag(GlobalConstants.LOCATION, "max");
    revalidateTag(GlobalConstants.EVENT, "max");
};

export const deleteLocation = async (locationId: string): Promise<void> => {
    // Validate location ID format
    const validatedLocationId = UuidSchema.parse(locationId);

    await prisma.location.delete({ where: { id: validatedLocationId } });
    revalidateTag(GlobalConstants.LOCATION, "max");
    revalidateTag(GlobalConstants.EVENT, "max");
};
