"use server";
import { Card, CardContent, Typography } from "@mui/material";
import React from "react";
import OrderSummary from "./OrderSummary";
import PaymentHandler from "../../ui/payment/PaymentHandler";
import { getLoggedInUser } from "../../lib/user-actions";
import { prisma } from "../../../prisma/prisma-client";
import { checkPaymentStatus } from "../../lib/payment-actions";
import { redirect } from "next/navigation";
import { NextURL } from "next/dist/server/web/next-url";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

interface OrderPageProps {
    searchParams: Promise<{ [orderId: string]: string }>;
}

const OrderPage = async ({ searchParams }: OrderPageProps) => {
    const orderId = (await searchParams).orderId as string;

    // Always make sure the order state is updated
    try {
        await checkPaymentStatus(orderId);
    } catch {
        // If payment status check fails, still show the order page
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { product: true } } },
    });
    const loggedInUser = await getLoggedInUser();

    if (!order || !loggedInUser)
        return <Typography color="primary">Failed to load order</Typography>;

    if (!loggedInUser || loggedInUser?.id !== order?.userId) {
        redirect(new NextURL("/", process.env.VERCEL_URL).toString());
    }

    return (
        <ErrorBoundarySuspense errorMessage="Failed to load order">
            <Card>
                <CardContent>
                    <OrderSummary order={order} />
                    <PaymentHandler order={order} />
                </CardContent>
            </Card>
        </ErrorBoundarySuspense>
    );
};

export default OrderPage;
