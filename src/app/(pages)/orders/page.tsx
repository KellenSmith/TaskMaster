"use server";
import OrdersDashboard from "./OrdersDashboard";
import { getAllOrders } from "../../lib/order-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const OrdersPage = async () => {
    const ordersPromise = getAllOrders();
    return (
        <ErrorBoundarySuspense>
            <OrdersDashboard ordersPromise={ordersPromise} />
        </ErrorBoundarySuspense>
    );
};

export default OrdersPage;
