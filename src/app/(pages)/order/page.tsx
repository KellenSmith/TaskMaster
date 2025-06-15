"use client";
import { Card, CardContent, CircularProgress } from "@mui/material";
import React, { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUserContext } from "../../context/UserContext";
import { DatagridActionState, defaultActionState } from "../../ui/Datagrid";
import { getOrderById } from "../../lib/order-actions";
import GlobalConstants from "../../GlobalConstants";
import { navigateToRoute } from "../../ui/utils";
import OrderSummary from "./OrderSummary";
import PaymentHandler from "../../ui/payment/PaymentHandler";

const OrderPage = () => {
    const paymentMethods = useMemo<{
        [key: string]: string;
    }>(
        () => ({
            SWISH: "Swish",
        }),
        [],
    );
    const { user } = useUserContext();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = useMemo(() => searchParams.get(GlobalConstants.ORDER_ID), [pathname]);
    const [chosenPaymentMethod, setChosenPaymentMethod] = useState<string | null>(null);

    const getOrderProp = (orderProp?: string) => {
        if (getOrderActionState.status === 200 && getOrderActionState.result.length > 0) {
            const order = getOrderActionState.result[0];
            if (!orderProp) return order;
            return order[orderProp];
        }
        return null;
    };

    const getOrder = async (currentState: DatagridActionState) => {
        const getOrderResult = await getOrderById(currentState, orderId);
        const orderUserId = getOrderProp(GlobalConstants.USER_ID);
        if (user && user[GlobalConstants.ID] !== orderUserId) navigateToRoute("/", router);
        return getOrderResult;
    };

    const [getOrderActionState, getOrderAction, isOrderLoading] = useActionState(
        getOrder,
        defaultActionState,
    );

    useEffect(() => {
        startTransition(() => {
            getOrderAction();
        });
    }, []);

    return (
        <Card>
            <CardContent>
                {isOrderLoading ? (
                    <CircularProgress />
                ) : (
                    <>
                        <OrderSummary order={getOrderProp()} />
                        <PaymentHandler order={getOrderProp()} />
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default OrderPage;
