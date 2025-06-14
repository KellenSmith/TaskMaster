import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { processOrderItems, updateOrderStatus } from "../../lib/order-actions";
import { defaultActionState } from "../../ui/form/Form";

interface IPaymentOrder {
    id: string;
    instrument: string;
    number: number;
}

interface PaymentCallbackRequest {
    orderReference: string;
    paymentOrder: IPaymentOrder;
}

// Validate that the request comes from an allowed IP address
const isAllowedIp = (request: NextRequest): boolean => {
    // Get client IP address
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0];
    if (!clientIp) return false;
    // Convert IP range to numeric for comparison
    const ipToNumber = (ip: string): number => {
        const parts = ip.split(".");
        return (
            ((parseInt(parts[0]) << 24) |
                (parseInt(parts[1]) << 16) |
                (parseInt(parts[2]) << 8) |
                parseInt(parts[3])) >>>
            0
        );
    };

    const start = ipToNumber("20.91.170.120");
    const end = ipToNumber("20.91.170.127"); // 120 + 7 for /29
    const client = ipToNumber(clientIp);

    return client >= start && client <= end;
};

enum PaymentState {
    INITIALIZED = "Initialized",
    COMPLETED = "Completed",
    CANCELLED = "Cancelled",
    FAILED = "Failed",
    ABORTED = "Aborted",
}
const getNewOrderStatus = (paymentState: PaymentState) => {
    switch (paymentState) {
        case PaymentState.COMPLETED:
            return OrderStatus.paid;
        case PaymentState.CANCELLED:
        case PaymentState.FAILED:
        case PaymentState.ABORTED:
            return OrderStatus.cancelled;
        default:
            return OrderStatus.pending;
    }
};

export async function POST(request: NextRequest): Promise<NextResponse> {
    // TODO: Validate IP address
    // if (!isAllowedIp(request)) {
    //     console.warn(`Unauthorized access attempt from IP: ${request.ip}`);
    //     return new NextResponse("Unauthorized", { status: 401 });
    // }

    try {
        // TODO: Accept real request body
        const body: PaymentCallbackRequest = await request.json();

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
            mockedPaymentResource.authorization.transaction.state as PaymentState,
        );
        const updateOrderStatusResult = await updateOrderStatus(
            orderId,
            defaultActionState,
            newOrderStatus,
        );
        if (updateOrderStatusResult.status === 200) {
            // Process order products, update inventory, etc.
            await processOrderItems(orderId, defaultActionState);
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("Payment callback error:", error);
        return new NextResponse(error instanceof Error ? error.message : "Internal server error", {
            status: 500,
        });
    }
}
