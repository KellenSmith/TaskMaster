"use server";
import { Card, CardContent, CircularProgress, Typography } from "@mui/material";
import React, { Suspense } from "react";
import OrderSummary from "./OrderSummary";
import PaymentHandler from "../../ui/payment/PaymentHandler";
import { ErrorBoundary } from "react-error-boundary";
import { unstable_cache } from "next/cache";
import { getOrderById } from "../../lib/order-actions";
import GlobalConstants from "../../GlobalConstants";
import { getLoggedInUser } from "../../lib/user-actions";
import { prisma } from "../../../prisma/prisma-client";
import { checkPaymentStatus } from "../../lib/payment-actions";
import { redirect } from "next/navigation";
import { NextURL } from "next/dist/server/web/next-url";

const OrderPage = async ({ searchParams }) => {
    const orderId = (await searchParams).orderId as string;

    // Always make sure the order state is updated
    try {
        await checkPaymentStatus(orderId);
    } catch {}

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
        <ErrorBoundary fallback={<Typography color="primary">Failed to load order</Typography>}>
            <Suspense fallback={<CircularProgress />}>
                <Card>
                    <CardContent>
                        <OrderSummary order={order} />
                        <PaymentHandler order={order} />
                    </CardContent>
                </Card>
            </Suspense>
        </ErrorBoundary>
    );
};

export default OrderPage;
