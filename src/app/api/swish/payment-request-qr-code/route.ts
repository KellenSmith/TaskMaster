import { NextRequest, NextResponse } from "next/server";
import {
    createPaymentRequest,
    ICreatePaymentRequestResponse,
    isRequestAuthorized,
} from "../swish-utils";
import GlobalConstants from "../../../GlobalConstants";
import { OrgSettings } from "../../../lib/org-settings";
import { swish } from "../swish-client";
import { SwishConstants } from "../../../lib/swish-constants";

/**
 * Run this serverless fcn in nodejs env to enable configuring
 * TLS certs to access Swish endpoints.
 */
export const config = {
    runtime: "nodejs",
};

const getQrCodeForPaymentRequest = async (
    paymentRequest: ICreatePaymentRequestResponse,
): Promise<ArrayBuffer | null> => {
    const data = {
        token: paymentRequest.token,
        size: OrgSettings[GlobalConstants.SWISH_QR_CODE_SIZE],
        format: "png",
        border: "0",
    };

    try {
        const response = await swish.post(
            `https://mpc.getswish.net/qrg-swish/api/v1/commerce`,
            data,
            { responseType: "arraybuffer" },
        );

        if (response.status === 200) {
            return response.data;
        }
    } catch {
        return null;
    }
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

    const qrCode = await getQrCodeForPaymentRequest(paymentRequest);

    if (!qrCode)
        return new NextResponse("Failed to generate QR code", {
            status: 500,
        });

    return new NextResponse(qrCode, {
        headers: {
            "Content-Type": "image/png",
        },
    });
};
