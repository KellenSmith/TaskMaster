"use server";

import { Typography } from "@mui/material";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import OrdersDashboard from "./OrdersDashboard";
import { unstable_cache } from "next/cache";
import { getAllOrders } from "../../lib/order-actions";
import GlobalConstants from "../../GlobalConstants";

const OrdersPage = () => {
    const ordersPromise = unstable_cache(getAllOrders, [], { tags: [GlobalConstants.ORDER] })();
    return (
        <ErrorBoundary fallback={<Typography color="primary">Error loading orders</Typography>}>
            <Suspense>
                <OrdersDashboard ordersPromise={ordersPromise} />
            </Suspense>
        </ErrorBoundary>
    );
};

export default OrdersPage;
