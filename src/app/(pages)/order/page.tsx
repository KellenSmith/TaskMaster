"use server";
import React from "react";
import ErrorBoundarySuspense, { ErrorFallback } from "../../ui/ErrorBoundarySuspense";
import { getOrderById } from "../../lib/order-actions";
import GlobalConstants from "../../GlobalConstants";
import OrderDashboard from "./OrderDashboard";
import { getLoggedInUser } from "../../lib/user-actions";

interface OrderPageProps {
    searchParams: Promise<{ [orderId: string]: string }>;
}

const OrderPage = async ({ searchParams }: OrderPageProps) => {
    const orderId = (await searchParams)[GlobalConstants.ORDER_ID] as string;
    const loggedInUser = await getLoggedInUser();

    if (!loggedInUser || !orderId) {
        // Redirect to home page if not logged in or no order ID provided
        return <ErrorFallback />;
    }

    const orderPromise = getOrderById(loggedInUser?.id, orderId);

    return (
        <ErrorBoundarySuspense>
            <OrderDashboard orderPromise={orderPromise} />
        </ErrorBoundarySuspense>
    );
};

export default OrderPage;
