import { NextRequest, NextResponse } from "next/server";
import { progressOrder } from "../../lib/order-actions";
import { getNewOrderStatus, PaymentStateType } from "../../lib/payment-utils";

interface PaymentCallbackRequestBody {
    paymentorder: string;
    authorization: {
        id: string;
        itemDescriptions: {
            id: string;
        };
        transaction: {
            id: string;
            created: string;
            updated: string;
            type: string;
            state: PaymentStateType;
            number: number;
            amount: number;
            vatAmount: number;
            description: string;
            payeeReference: string;
            isOperational: boolean;
            problem?: {
                type: string;
                title: string;
                status: number;
                detail: string;
                problems: unknown[];
                operations: Array<{
                    href: string;
                    rel: string;
                    method: string;
                }>;
            };
        };
    };
}

const getClientIp = (request: NextRequest): string | null => {
    // Try multiple headers for better IP detection
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const xRealIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    // Use the first available IP, preferring Cloudflare's header
    return cfConnectingIp || xRealIp || xForwardedFor?.split(",")[0]?.trim() || null;
};

const isAllowedIp = (request: NextRequest): boolean => {
    const clientIp = getClientIp(request);
    if (!clientIp) {
        console.warn("No client IP found in headers");
        return false;
    }

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

    const isAllowed = allowedIps.includes(clientIp);
    if (!isAllowed) {
        console.warn(`Blocked request from IP: ${clientIp}`);
    }

    return isAllowed;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
    const clientIp = getClientIp(request);

    if (!isAllowedIp(request)) {
        console.error(
            `Unauthorized payment callback attempt from IP: ${clientIp}, Referrer: ${request.headers.get("referer")}`,
        );
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // TODO: Verify webhook signature here
    // const signature = request.headers.get('x-swedbank-signature') || request.headers.get('authorization');
    // if (!signature || !verifyWebhookSignature(JSON.stringify(requestBody), signature, process.env.SWEDBANK_WEBHOOK_SECRET)) {
    //     console.error(`Invalid webhook signature from IP: ${clientIp}`);
    //     return new NextResponse("Invalid signature", { status: 401 });
    // }        // Validate required fields in payload

    try {
        const requestBody: PaymentCallbackRequestBody = await request.json();

        const orderId = request.nextUrl.searchParams.get("orderId");
        if (!orderId || !requestBody.authorization?.transaction?.state) {
            console.warn(`Invalid payload structure from IP: ${clientIp}`);
            return new NextResponse("Bad Request: Missing required fields", { status: 400 });
        }

        // Update order by id
        const transactionState = requestBody.authorization.transaction.state;
        const newOrderStatus = getNewOrderStatus(transactionState);

        try {
            await progressOrder(orderId, newOrderStatus);
        } catch (error) {
            console.error(`Failed to update order ${orderId}: ${error.message}`);
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error(`Payment callback error from IP ${clientIp}:`, error);
        // Don't expose internal error details to external callers
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
