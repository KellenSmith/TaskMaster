"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import { DatagridActionState } from "../ui/Datagrid";
import { createProductSchema, updateProductSchema } from "./zod-schemas";
import GlobalConstants from "../GlobalConstants";

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

export const getMembershipProduct = async (): Promise<string> => {
    try {
        // Try to find existing membership product
        const membershipProduct = await prisma.product.findFirst({
            where: { name: GlobalConstants.MEMBERSHIP_PRODUCT_NAME },
        });

        if (membershipProduct) {
            return membershipProduct.id;
        }

        // If no membership product exists, create it
        const newMembershipProduct = await prisma.product.create({
            data: {
                name: GlobalConstants.MEMBERSHIP_PRODUCT_NAME,
                description: "Annual membership",
                price: parseFloat(process.env.NEXT_PUBLIC_MEMBERSHIP_FEE || "0"),
                unlimitedStock: true,
            },
        });

        return newMembershipProduct.id;
    } catch (error) {
        throw new Error(`Failed to get/create membership product: ${error.message}`);
    }
};
