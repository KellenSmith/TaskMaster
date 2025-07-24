"use client";
import { Card, CardContent, CircularProgress } from "@mui/material";
import React, { startTransition, useActionState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserContext } from "../../context/UserContext";
import { getOrderById } from "../../lib/order-actions";
import GlobalConstants from "../../GlobalConstants";
import { navigateToRoute } from "../../ui/utils";
import OrderSummary from "./OrderSummary";
import PaymentHandler from "../../ui/payment/PaymentHandler";
import { DatagridActionState, defaultDatagridActionState } from "../../lib/definitions";

const OrderPage = () => {
    const { user } = useUserContext();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = useMemo(() => searchParams.get(GlobalConstants.ORDER_ID), [searchParams]);

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
        defaultDatagridActionState,
    );

    useEffect(() => {
        startTransition(() => {
            getOrderAction();
        });
        // Load order when component mounts
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
