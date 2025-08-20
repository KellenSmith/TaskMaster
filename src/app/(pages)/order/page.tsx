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

const OrderPage = async ({ searchParams }) => {
    const orderId = searchParams.orderId as string;
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const loggedInUser = await getLoggedInUser();

    if (order && loggedInUser?.id !== order?.userId) {
        return <Typography color="primary">Failed to load order</Typography>;
    }

    const orderPromise = unstable_cache(getOrderById, [orderId], {
        tags: [GlobalConstants.ORDER],
    })(orderId);

    return (
        <ErrorBoundary fallback={<Typography color="primary">Failed to load order</Typography>}>
            <Suspense fallback={<CircularProgress />}>
                <Card>
                    <CardContent>
                        <OrderSummary orderPromise={orderPromise} />
                        <PaymentHandler orderPromise={orderPromise} />
                    </CardContent>
                </Card>
            </Suspense>
        </ErrorBoundary>
    );
};

export default OrderPage;
