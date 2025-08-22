"use server";
import OrdersDashboard from "./OrdersDashboard";
import { unstable_cache } from "next/cache";
import { getAllOrders } from "../../lib/order-actions";
import GlobalConstants from "../../GlobalConstants";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const OrdersPage = () => {
    const ordersPromise = unstable_cache(getAllOrders, [], { tags: [GlobalConstants.ORDER] })();
    return (
        <ErrorBoundarySuspense errorMessage="Failed to load orders">
            <OrdersDashboard ordersPromise={ordersPromise} />
        </ErrorBoundarySuspense>
    );
};

export default OrdersPage;
