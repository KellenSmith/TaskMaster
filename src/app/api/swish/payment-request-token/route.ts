import { NextRequest, NextResponse } from "next/server";
import { createPaymentRequest, isRequestAuthorized } from "../swish-utils";
import GlobalConstants from "../../../GlobalConstants";
import { SwishConstants } from "../../../lib/swish-constants";

/**
 * Run this serverless fcn in nodejs env to enable configuring
 * TLS certs to access Swish endpoints.
 */
export const config = {
    runtime: "nodejs",
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
    if (!isRequestAuthorized(request)) {
        // Log unauthorized access to api for sleuthing
        console.warn(`Unauthorized access: ${request.headers.get("referer")}`);
        return new NextResponse("Unauthorized", {
            status: 401,
        });
    }

    const requestUrl = new URL(request.url);
    const userId = requestUrl.searchParams.get(GlobalConstants.ID);
    const amount = parseInt(requestUrl.searchParams.get(SwishConstants.AMOUNT));
    if (!userId || !amount) {
        return new NextResponse("Missing parameters", {
            status: 400,
        });
    }

    const paymentRequest = await createPaymentRequest(amount, userId);
    if (!paymentRequest)
        return new NextResponse("Payment failed", {
            status: 500,
        });

    return NextResponse.json(paymentRequest);
};
