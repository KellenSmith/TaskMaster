"use client";

import { Button, Stack } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import axios from "axios";
import { navigateToRoute } from "../../../ui/utils";
import GlobalConstants from "../../../GlobalConstants";

// TODO: Eliminate this component when real payment integration is implemented
const DevPaymentPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = useMemo(() => searchParams.get(GlobalConstants.ORDER_ID), [searchParams]);

    const handleAction = async () => {
        try {
            await axios.post(`${window.location.origin}/api/payment-callback`, {
                orderReference: orderId,
                paymentOrder: {
                    id: "/psp/paymentorders/7e6cdfc3-1276-44e9-9992-7cf4419750e1",
                    instrument: "paymentorders",
                    number: 12345678,
                },
            });
            navigateToRoute(`/${GlobalConstants.ORDER}?orderId=${orderId}`, router);
        } catch (error) {
            console.error("Payment simulation failed:", error);
        }
    };

    return (
        <Stack spacing={2} alignItems="center">
            <Button onClick={() => handleAction()} color="success">
                Simulate Payment
            </Button>
        </Stack>
    );
};

export default DevPaymentPage;
