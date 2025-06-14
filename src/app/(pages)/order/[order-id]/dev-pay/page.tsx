"use client";

import { Button, Stack } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import axios from "axios";
import { navigateToRoute } from "../../../../ui/utils";
import GlobalConstants from "../../../../GlobalConstants";

// TODO: Eliminate this component when real payment integration is implemented
const DevPaymentPage = () => {
    const pathname = usePathname();
    const router = useRouter();
    const orderId = useMemo(() => pathname.split("/").at(-2), [pathname]);

    const handleAction = async (action: string) => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/payment-callback`, {
                orderReference: orderId,
                paymentOrder: {
                    id: "/psp/paymentorders/7e6cdfc3-1276-44e9-9992-7cf4419750e1",
                    instrument: "paymentorders",
                    number: 12345678,
                },
            });
            navigateToRoute(`/${GlobalConstants.ORDER}/${orderId}`, router);
        } catch (error) {
            console.error("Payment simulation failed:", error);
        }
    };

    return (
        <Stack spacing={2} alignItems="center">
            <Button onClick={() => handleAction("PAID")} color="success">
                Simulate Payment
            </Button>
            <Button onClick={() => handleAction("CANCELLED")} color="error">
                Cancel Order
            </Button>
        </Stack>
    );
};

export default DevPaymentPage;
