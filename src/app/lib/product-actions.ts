"use server";

import { Prisma, Product, TicketType } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import {
    MembershipCreateSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
    UserMembershipWithoutProductSchema,
} from "./zod-schemas";
import dayjs from "dayjs";
import { DatagridActionState } from "./definitions";
import { renewUserMembership } from "./user-membership-actions";
import z from "zod";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";

export const getAllProducts = async (): Promise<Product[]> => {
    try {
        return await prisma.product.findMany();
    } catch (error) {
        throw new Error(`Failed fetching products`);
    }
};

export const createProduct = async (
    parsedFieldValues: z.infer<typeof ProductCreateSchema>,
): Promise<void> => {
    try {
        await prisma.product.create({
            data: parsedFieldValues,
        });
        revalidateTag(GlobalConstants.PRODUCT);
    } catch (error) {
        throw new Error(`Failed creating product`);
    }
};

export const createMembershipProduct = async (
    parsedFieldValues: z.infer<typeof MembershipCreateSchema>,
): Promise<void> => {
    try {
        const membershipValues = UserMembershipWithoutProductSchema.parse(parsedFieldValues);
        const productValues = ProductCreateSchema.parse(parsedFieldValues);
        await prisma.membership.create({
            data: {
                ...membershipValues,
                product: {
                    create: productValues,
                },
            },
        });
        revalidateTag(GlobalConstants.PRODUCT);
        revalidateTag(GlobalConstants.MEMBERSHIP);
    } catch (error) {
        throw new Error("Failed to create membership");
    }
};

export const updateProduct = async (
    productId: string,
    parsedFieldValues: z.infer<typeof ProductUpdateSchema>,
): Promise<void> => {
    try {
        await prisma.product.update({
            where: { id: productId },
            data: parsedFieldValues,
        });
        revalidateTag(GlobalConstants.PRODUCT);
    } catch (error) {
        throw new Error(`Failed updating product`);
    }
};

export const deleteProduct = async (product: Product): Promise<void> => {
    try {
        const membership = await prisma.membership.findUnique({
            where: { productId: product.id },
        });
        const ticket = await prisma.ticket.findUnique({
            where: { productId: product.id },
        });

        const deleteRelationsPromises = [];
        if (membership)
            deleteRelationsPromises.push(
                prisma.membership.delete({
                    where: { productId: product.id },
                }),
            );
        if (ticket)
            deleteRelationsPromises.push(
                prisma.ticket.delete({
                    where: { productId: product.id },
                }),
            );

        await prisma.$transaction([
            ...deleteRelationsPromises,
            prisma.product.delete({
                where: { id: product.id },
            }),
        ]);
        revalidateTag(GlobalConstants.PRODUCT);
    } catch (error) {
        throw new Error(`Failed deleting product`);
    }
};

export const processOrderedProduct = async (
    userId: string,
    orderItem: Prisma.OrderItemGetPayload<{
        include: { product: { include: { membership: true; ticket: true } } };
    }>,
) => {
    const failedProducts: string[] = [];
    for (let i = 0; i < orderItem.quantity; i++) {
        if (orderItem.product.membership) {
            try {
                await renewUserMembership(userId, orderItem.product.membership.id);
            } catch {
                failedProducts.push(`Failed to renew membership for user ${userId}`);
            }
        } else if (orderItem.product.ticket) {
            // Add user as participant for the ticket
            try {
                await prisma.participantInEvent.create({
                    data: {
                        userId,
                        eventId: orderItem.product.ticket.eventId,
                        ticketId: orderItem.product.ticket.id,
                    },
                });
            } catch (error) {
                failedProducts.push(
                    `Failed to create participant for user ${userId} in event ${orderItem.product.ticket.eventId}: ${error.message}`,
                );
            }
        }
    }
    if (failedProducts.length > 0) {
        throw new Error(failedProducts.join(", "));
    }
};

export const getEventTickets = async (
    eventId: string,
    selectedTaskIds: string[],
    currentActionState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const eligibleTicketTypes: TicketType[] = [TicketType.standard];
        if (selectedTaskIds.length > 0) eligibleTicketTypes.push(TicketType.volunteer);
        const event = await prisma.event.findUniqueOrThrow({
            where: { id: eventId },
            select: { startTime: true },
        });
        const eventStartTime = event.startTime;
        if (dayjs(eventStartTime).subtract(14, "d").isAfter(dayjs()))
            eligibleTicketTypes.push(TicketType.earlyBird);

        const tickets = await prisma.ticket.findMany({
            where: { eventId, type: { in: eligibleTicketTypes } },
            include: {
                product: true,
            },
        });
        newActionState.status = 200;
        newActionState.result = tickets;
        newActionState.errorMsg = "";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};
