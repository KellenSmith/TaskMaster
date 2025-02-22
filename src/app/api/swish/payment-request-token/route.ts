import { NextRequest, NextResponse } from "next/server";
import { createPaymentRequest } from "../swish-utils";
import GlobalConstants from "../../../GlobalConstants";
import { OrgSettings } from "../../../lib/org-settings";

/**
 * Run this serverless fcn in nodejs env to enable configuring
 * TLS certs to access Swish endpoints.
 */
export const config = {
    runtime: "nodejs",
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
    // TODO: verify caller auth
    const requestUrl = new URL(request.url);
    const userId = requestUrl.searchParams.get(GlobalConstants.ID);

    const paymentRequest = await createPaymentRequest(
        OrgSettings[GlobalConstants.MEMBERSHIP_FEE] as number,
        userId,
    );
    if (!paymentRequest)
        return new NextResponse("Payment failed", {
            status: 500,
        });

    return NextResponse.json(paymentRequest);
};
