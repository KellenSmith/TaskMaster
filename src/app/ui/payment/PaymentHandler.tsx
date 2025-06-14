"use client";
import { Button, Stack } from "@mui/material";
import React, { useState } from "react";
import GlobalConstants from "../../GlobalConstants";
import { getPaymentRedirectUrl } from "../../lib/payment-actions";
import { defaultActionState, getFormActionMsg } from "../form/Form";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";

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

    return (
        order && (
            <Stack spacing={2} alignItems="center">
                {order[GlobalConstants.STATUS] === OrderStatus.pending && (
                    <Button onClick={redirectToPayment}>pay</Button>
                )}
                {getFormActionMsg(paymentActionState)}
            </Stack>
        )
    );
};

export default PaymentHandler;
