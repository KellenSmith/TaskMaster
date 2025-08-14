"use client";
import { Button, Stack } from "@mui/material";
import React, { useState } from "react";
import GlobalConstants from "../../GlobalConstants";
import { getPaymentRedirectUrl } from "../../lib/payment-actions";
import { getFormActionMsg } from "../form/Form";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "../../lib/order-actions";
import { defaultFormActionState } from "../../lib/definitions";
import { navigateToRoute } from "../utils";

const PaymentHandler = ({ order }) => {
    const router = useRouter();
    const [paymentActionState, setPaymentActionState] = useState(defaultFormActionState);

    const redirectToPayment = async () => {
        const orderId = order[GlobalConstants.ID];
        const redirectUrlResult = await getPaymentRedirectUrl(defaultFormActionState, orderId);
        if (redirectUrlResult.status === 200 && redirectUrlResult.result) {
            const redirectUrl = redirectUrlResult.result;
            router.push(redirectUrl);
            redirectUrlResult.result = `Redirecting to payment...`;
        }
        setPaymentActionState(redirectUrlResult);
    };

    const [processOrderActionState, setProcessOrderActionState] = useState(defaultFormActionState);

    return (
        order &&
        order[GlobalConstants.STATUS] === OrderStatus.pending && (
            <Stack spacing={2} alignItems="center">
                {order[GlobalConstants.TOTAL_AMOUNT] === 0 ? (
                    <Button
                        fullWidth
                        onClick={async () => {
                            const processOrderResult = await updateOrderStatus(
                                order.id,
                                defaultFormActionState,
                                OrderStatus.paid,
                            );
                            setProcessOrderActionState(processOrderResult);
                            navigateToRoute(`/order/complete?orderId=${order.id}`, router);
                        }}
                    >
                        confirm
                    </Button>
                ) : (
                    <Button fullWidth onClick={redirectToPayment}>
                        pay
                    </Button>
                )}
                {getFormActionMsg(paymentActionState)}
                {getFormActionMsg(processOrderActionState)}
            </Stack>
        )
    );
};

export default PaymentHandler;
