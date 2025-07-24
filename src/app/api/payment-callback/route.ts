import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "../../lib/order-actions";
import { defaultActionState } from "../../ui/form/Form";
import { getNewOrderStatus, PaymentStateType } from "../../lib/payment-utils";

interface IPaymentOrder {
    id: string;
    instrument: string;
    number: number;
}

interface PaymentCallbackRequest {
    orderReference: string;
    paymentOrder: IPaymentOrder;
}

const isAllowedIp = (request: NextRequest): boolean => {
    // Get client IP address
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0];
    if (!clientIp) return false;

    const allowedIps = [
        "20.91.170.120",
        "20.91.170.121",
        "20.91.170.122",
        "20.91.170.123",
        "20.91.170.124",
        "20.91.170.125",
        "20.91.170.126",
        "20.91.170.127",
    ];

    return allowedIps.includes(clientIp);
};

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (!isAllowedIp(request)) {
        console.warn(`Unauthorized access attempt from referrer: ${request.referrer}`);
        return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Payment callback received");
    try {
        // TODO: Accept real request body
        const body: PaymentCallbackRequest = await request.json();

        console.log("Payment callback body:", body);

        // TODO: Find payment resource by ID
        const mockedPaymentResource = {
            paymentorder: "/psp/paymentorders/7e6cdfc3-1276-44e9-9992-7cf4419750e1",
            authorization: {
                id: "/psp/paymentorders/7e6cdfc3-1276-44e9-9992-7cf4419750e1/currentpayment/ec2a9b09-601a-42ae-8e33-a5737e1cf177",
                itemDescriptions: {
                    id: "/psp/paymentorders/7e6cdfc3-1276-44e9-9992-7cf4419750e1/currentpayment/ec2a9b09-601a-42ae-8e33-a5737e1cf177/itemDescriptions",
                },
                transaction: {
                    id: "/psp/paymentorders/7e6cdfc3-1276-44e9-9992-7cf4419750e1/currentpayment/ec2a9b09-601a-42ae-8e33-a5737e1cf177",
                    created: "2016-09-14T01:01:01.01Z",
                    updated: "2016-09-14T01:01:01.03Z",
                    type: "Authorization",
                    state: "Completed",
                    number: 1234567890,
                    amount: 1000,
                    vatAmount: 250,
                    description: "Test transaction",
                    payeeReference: "ABC123",
                    isOperational: false,
                    problem: {
                        type: "https://api.payex.com/psp/errordetail/paymentorders/3DSECUREERROR",
                        title: "Error when complete authorization",
                        status: 400,
                        detail: "Unable to complete 3DSecure verification!",
                        problems: [],
                        operations: [
                            {
                                href: "/psp/paymentorders/7e6cdfc3-1276-44e9-9992-7cf4419750e1/currentpayment/ec2a9b09-601a-42ae-8e33-a5737e1cf177",
                                rel: "edit-authorization",
                                method: "PATCH",
                            },
                        ],
                    },
                },
            },
        };

        // Update order by reference (id)
        const orderId = body.orderReference;
        const newOrderStatus = getNewOrderStatus(
            mockedPaymentResource.authorization.transaction.state as unknown as PaymentStateType,
        );
        const updateOrderStatusResult = await updateOrderStatus(
            orderId,
            defaultActionState,
            newOrderStatus,
        );
        if (updateOrderStatusResult.status !== 200) {
            throw new Error(updateOrderStatusResult.errorMsg || "Failed to update order status");
        }
    } catch (error) {
        console.error("Payment callback error:", error);
    }
    return new NextResponse("OK", { status: 200 });
}
