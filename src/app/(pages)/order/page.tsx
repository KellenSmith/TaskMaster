"use server";
import React from "react";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { unstable_cache } from "next/cache";
import { getOrderById } from "../../lib/order-actions";
import GlobalConstants from "../../GlobalConstants";
import OrderDashboard from "./OrderDashboard";

interface OrderPageProps {
    searchParams: Promise<{ [orderId: string]: string }>;
}

const OrderPage = async ({ searchParams }: OrderPageProps) => {
    const orderId = (await searchParams).orderId as string;

    const orderPromise = unstable_cache(getOrderById, [orderId], {
        tags: [GlobalConstants.ORDER],
    })(orderId);

    return (
        <ErrorBoundarySuspense errorMessage="Failed to load order">
            <OrderDashboard orderPromise={orderPromise} />
        </ErrorBoundarySuspense>
    );
};

export default OrderPage;
