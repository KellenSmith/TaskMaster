"use server";

import { Prisma, TicketType } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { DatagridActionState } from "../ui/Datagrid";
import {
    createMembershipProductSchema,
    createProductSchema,
    updateProductSchema,
} from "./zod-schemas";
import GlobalConstants from "../GlobalConstants";
import { renewUserMembership } from "./user-actions";
import dayjs from "dayjs";
import { FormActionState } from "./definitions";

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
        const parsedFieldValues = createProductSchema.parse(fieldValues);
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
    fieldValues: Prisma.ProductCreateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const parsedFieldValues = createMembershipProductSchema.parse(fieldValues);
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
        const parsedFieldValues = updateProductSchema.parse(fieldValues);
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
    fieldValues: Prisma.ProductUpdateInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const parsedFieldValues = updateProductSchema.parse(fieldValues);
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
    productId: string,
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.product.delete({
            where: { id: productId },
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

export const getMembershipProductId = async (): Promise<string> => {
    try {
        // Try to find existing membership product
        const membershipProduct = await prisma.membership.findFirst({
            select: {
                productId: true,
            },
        });

        if (membershipProduct) {
            return membershipProduct.productId;
        }

        // If no membership product exists, create it
        const newMembershipProduct = await prisma.product.create({
            data: {
                name: GlobalConstants.MEMBERSHIP_PRODUCT_NAME,
                description: "Annual membership",
                price: parseFloat(process.env.NEXT_PUBLIC_MEMBERSHIP_FEE || "0"),
                unlimitedStock: true,
                Membership: {
                    create: {
                        duration: 365,
                    },
                },
            },
        });

        return newMembershipProduct.id;
    } catch (error) {
        throw new Error(`Failed to get/create membership product: ${error.message}`);
    }
};

export const processOrderedProduct = async (
    productId: string,
    quantity: number,
    userId: string,
    currentActionState: FormActionState,
) => {
    const newActionState = { ...currentActionState };
    const product = await prisma.product.findUniqueOrThrow({
        where: { id: productId },
        include: { Membership: true, Ticket: true },
    });
    const failedProducts: string[] = [];
    for (let i = 0; i < quantity; i++) {
        if (product.Membership) {
            const renewMembershipResult = await renewUserMembership(
                userId,
                product.Membership,
                currentActionState,
            );
            if (renewMembershipResult.status !== 200) {
                failedProducts.push(`Membership renewal failed for user ${userId}`);
            }
        } else if (product.Ticket) {
            // Add user as participant for the ticket
            try {
                await prisma.participantInEvent.create({
                    data: {
                        userId,
                        eventId: product.Ticket.eventId,
                        ticketId: product.Ticket.id,
                    },
                });
            } catch (error) {
                console.log(error.message);
                failedProducts.push(
                    `Failed to create participant for user ${userId} in event ${product.Ticket.eventId}: ${error.message}`,
                );
            }
        }
    }
    newActionState.status = 200;
    newActionState.errorMsg = "";
    newActionState.result = `Processed ${quantity} of product ${productId} for user ${userId}`;
    if (failedProducts.length > 0) {
        newActionState.status = 500;
        newActionState.errorMsg = failedProducts.join(", ");
        newActionState.result = "";
        return newActionState;
    }
    return newActionState;
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
