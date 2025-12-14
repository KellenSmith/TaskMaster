"use server";
import OrdersDashboard from "./OrdersDashboard";
import { getAllOrders } from "../../lib/order-actions";
import GlobalConstants from "../../GlobalConstants";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const OrdersPage = () => {
    const ordersPromise = getAllOrders();
    return (
        <ErrorBoundarySuspense>
            <OrdersDashboard ordersPromise={ordersPromise} />
        </ErrorBoundarySuspense>
    );
};

export default OrdersPage;
