"use server";

import GlobalConstants from "../GlobalConstants";
import { prisma } from "../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import { AddMembershipSchema, UuidSchema } from "./zod-schemas";
import { getLoggedInUser } from "./user-helpers";
import { isUserAdmin } from "./utils";

export const addUserMembership = async (userId: string, formData: FormData) => {
    // Only allow admins to edit user memberships
    const loggedInUser = await getLoggedInUser();
    if (!isUserAdmin(loggedInUser)) throw new Error("Unauthorized");

    const parsedUserId = UuidSchema.parse(userId);
    const validatedData = AddMembershipSchema.parse(Object.fromEntries(formData.entries()));
    await prisma.userMembership.upsert({
        where: {
            user_id: parsedUserId,
        },
        create: {
            user: { connect: { id: parsedUserId } },
            membership: { connect: { product_id: validatedData.membership_id } },
            expires_at: validatedData.expires_at,
        },
        update: {
            expires_at: validatedData.expires_at,
            membership_id: validatedData.membership_id,
        },
    });
    revalidateTag(GlobalConstants.USER, "max");
};
