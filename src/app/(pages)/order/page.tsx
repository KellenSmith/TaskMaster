"use client";
import { Card, CardContent, CircularProgress, Typography, Stack } from "@mui/material";
import React, { useActionState, useEffect, useMemo, startTransition } from "react";
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

        // Check authorization using the result directly, not the state
        if (getOrderResult.status === 200 && getOrderResult.result.length > 0) {
            const order = getOrderResult.result[0];
            const orderUserId = order[GlobalConstants.USER_ID];
            if (user && user[GlobalConstants.ID] !== orderUserId) {
                navigateToRoute("/", router);
            }
        }

        return getOrderResult;
    };

    const [getOrderActionState, getOrderAction, isOrderLoading] = useActionState(
        getOrder,
        defaultDatagridActionState,
    );

    useEffect(() => {
        // Only fetch order when user data is available and orderId exists
        if (user && orderId) {
            startTransition(() => {
                getOrderAction();
            });
        }
    }, [user, getOrderAction, orderId]);

    return (
        <Card>
            <CardContent>
                {isOrderLoading ? (
                    <CircularProgress />
                ) : getOrderActionState.status !== 200 || !getOrderProp() ? (
                    <Stack alignItems="center" justifyContent="center" textAlign="center">
                        <Typography variant="h4" component="h2" gutterBottom>
                            Order Not Found
                        </Typography>
                    </Stack>
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
