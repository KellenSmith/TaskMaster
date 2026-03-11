"use server";

import GlobalConstants from "../GlobalConstants";
import { prisma } from "../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import { AddMembershipSchema, UuidSchema } from "./zod-schemas";
import { getMembershipProduct } from "./user-membership-helpers";

export const addUserMembership = async (userId: string, formData: FormData) => {
    const parsedUserId = UuidSchema.parse(userId);
    const validatedData = AddMembershipSchema.parse(Object.fromEntries(formData.entries()));
    const membershipProduct = await getMembershipProduct();
    await prisma.userMembership.upsert({
        where: {
            user_id: parsedUserId,
            membership_id: membershipProduct.id,
        },
        create: {
            user: { connect: { id: parsedUserId } },
            membership: { connect: { product_id: membershipProduct.id } },
            expires_at: validatedData.expires_at,
        },
        update: { expires_at: validatedData.expires_at },
    });
    revalidateTag(GlobalConstants.USER, "max");
};
