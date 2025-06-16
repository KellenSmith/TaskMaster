"use client";
import { Button, Stack } from "@mui/material";
import React, { startTransition, useActionState, useState } from "react";
import GlobalConstants from "../../GlobalConstants";
import { getPaymentRedirectUrl } from "../../lib/payment-actions";
import { defaultActionState, FormActionState, getFormActionMsg } from "../form/Form";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { processOrderItems } from "../../lib/order-actions";

const PaymentHandler = ({ order }) => {
    const router = useRouter();
    const [paymentActionState, setPaymentActionState] = useState(defaultActionState);

    const redirectToPayment = async () => {
        const orderId = order[GlobalConstants.ID];
        const redirectUrlResult = await getPaymentRedirectUrl(defaultActionState, orderId);
        setPaymentActionState(redirectUrlResult);
        if (redirectUrlResult.status === 200 && redirectUrlResult.result) {
            const redirectUrl = redirectUrlResult.result;
            router.push(redirectUrl);
        }
    };

    const [processOrderActionState, setProcessOrderActionState] = useState(defaultActionState);

    return (
        order &&
        order[GlobalConstants.STATUS] === OrderStatus.pending && (
            <Stack spacing={2} alignItems="center">
                {order[GlobalConstants.TOTAL_AMOUNT] === 0 ? (
                    <Button
                        onClick={async () => {
                            const processOrderResult = await processOrderItems(
                                order.id,
                                defaultActionState,
                            );
                            setProcessOrderActionState(processOrderResult);
                            router.refresh();
                        }}
                    >
                        confirm
                    </Button>
                ) : (
                    <Button onClick={redirectToPayment}>pay</Button>
                )}
                {getFormActionMsg(paymentActionState)}
                {getFormActionMsg(processOrderActionState)}
            </Stack>
        )
    );
};

export default PaymentHandler;
