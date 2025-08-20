"use server";

import { Prisma, Product, TicketType } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import {} from "./zod-schemas";
import dayjs from "dayjs";
import { DatagridActionState, FormActionState } from "./definitions";
import { renewUserMembership } from "./user-membership-actions";

export const getProductById = async (
    currentState: DatagridActionState,
    productId: string,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const product = await prisma.product.findUniqueOrThrow({
            where: { id: productId },
        });
        newActionState.status = 200;
        newActionState.result = [product];
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const getAllProducts = async (
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const products = await prisma.product.findMany();
        newActionState.status = 200;
        newActionState.result = products;
        newActionState.errorMsg = "";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const getAllMembershipProducts = async (
    currentActionState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const membershipProducts = await prisma.product.findMany({
            where: { Membership: { isNot: null } },
            include: {
                Membership: true, // Include membership details
            },
        });
        newActionState.status = 200;
        newActionState.result = membershipProducts;
        newActionState.errorMsg = "";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const createProduct = async (
    currentActionState: FormActionState,
    fieldValues: Prisma.ProductCreateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const parsedFieldValues = fieldValues;
        const createdProduct = await prisma.product.create({
            data: parsedFieldValues,
        });
        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = `Product #${createdProduct.id} ${createdProduct.name} created successfully`;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const createMembershipProduct = async (
    currentActionState: FormActionState,
    fieldValues: Prisma.MembershipCreateInput & Prisma.ProductCreateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const parsedFieldValues = fieldValues;
        const createdMembershipProduct = await prisma.product.create({
            data: {
                ...parsedFieldValues,
                Membership: {
                    create: {
                        duration: parsedFieldValues.duration as number,
                    },
                },
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = `Membership Product #${createdMembershipProduct.id} ${createdMembershipProduct.name} created successfully`;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }

    return newActionState;
};

export const updateProduct = async (
    productId: string,
    currentActionState: FormActionState,
    fieldValues: Prisma.ProductUpdateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const parsedFieldValues = fieldValues;
        await prisma.product.update({
            where: { id: productId },
            data: parsedFieldValues,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Updated successfully";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const updateMembershipProduct = async (
    productId: string,
    currentActionState: FormActionState,
    fieldValues: Prisma.MembershipUpdateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const parsedFieldValues = fieldValues;
        await prisma.product.update({
            where: { id: productId },
            data: {
                ...parsedFieldValues,
                Membership: {
                    update: {
                        duration: parsedFieldValues.duration as number,
                    },
                },
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Membership updated successfully";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const deleteProduct = async (
    product: Product,
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.product.delete({
            where: { id: product.id },
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Deleted successfully";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const processOrderedProduct = async (
    userId: string,
    orderItem: Prisma.OrderItemGetPayload<{
        include: { product: { include: { Membership: true; Ticket: true } } };
    }>,
) => {
    const failedProducts: string[] = [];
    for (let i = 0; i < orderItem.quantity; i++) {
        if (orderItem.product.Membership) {
            try {
                await renewUserMembership(userId, orderItem.product.Membership.id);
            } catch {
                failedProducts.push(`Failed to renew membership for user ${userId}`);
            }
        } else if (orderItem.product.Ticket) {
            // Add user as participant for the ticket
            try {
                await prisma.participantInEvent.create({
                    data: {
                        userId,
                        eventId: orderItem.product.Ticket.eventId,
                        ticketId: orderItem.product.Ticket.id,
                    },
                });
            } catch (error) {
                failedProducts.push(
                    `Failed to create participant for user ${userId} in event ${orderItem.product.Ticket.eventId}: ${error.message}`,
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
                Product: true,
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
