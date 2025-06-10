"use client";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import React, { useMemo, useState } from "react";
import GlobalConstants from "../../GlobalConstants";
import { OrderStatus } from "@prisma/client";

const PaymentHandler = ({ order }) => {
    const paymentMethods = useMemo<{
        [key: string]: string;
    }>(
        () => ({
            SWISH: "Swish",
        }),
        [],
    );
    const [chosenPaymentMethod, setChosenPaymentMethod] = useState<string | null>(null);

    const getPaymentStatusMsg = () => {
        if (!chosenPaymentMethod) return "";
        switch (order[GlobalConstants.STATUS]) {
            case OrderStatus.pending:
                return "Awaiting your payment...";
            case OrderStatus.paid:
                return "Thank you for your payment!";
            case OrderStatus.cancelled:
                return "Your order was cancelled";
            default: {
                return "Something went wrong...";
            }
        }
    };

    const getPaymentMethodButtons = () => {
        return (
            <Stack spacing={2} justifyContent="center" alignItems={"center"}>
                <Typography variant="h6">Choose a payment method</Typography>
                {Object.keys(paymentMethods).map((method) => {
                    return (
                        <Button key={method} onClick={() => setChosenPaymentMethod(method)}>
                            {paymentMethods[method]}
                        </Button>
                    );
                })}
            </Stack>
        );
    };

    const getPaymentMethodHandler = () => {
        return <Typography>{`Chosen payment method: ${chosenPaymentMethod}`}</Typography>;
    };

    return (
        <Stack spacing={2} alignItems="center">
            {!order ? (
                <CircularProgress />
            ) : chosenPaymentMethod ? (
                getPaymentMethodHandler()
            ) : (
                getPaymentMethodButtons()
            )}
            {getPaymentStatusMsg()}
        </Stack>
    );
};

export default PaymentHandler;
