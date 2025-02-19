import { NextRequest, NextResponse } from "next/server";
import {
  createPaymentRequest,
  getQrCodeForPaymentRequest,
} from "./swish-utils";
import GlobalConstants from "../../GlobalConstants";
import { OrgSettings } from "../../lib/org-settings";

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
  const callbackUrl = `${requestUrl.origin}/${requestUrl.pathname}`;

  const paymentRequest = await createPaymentRequest(
    OrgSettings[GlobalConstants.MEMBERSHIP_FEE] as number,
    "swish message",
    callbackUrl
  );

  const qrCode = await getQrCodeForPaymentRequest(paymentRequest);

  return new NextResponse(qrCode, {
    headers: {
      "Content-Type": "image/png",
    },
  });
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  // TODO: Verify caller ID
  const paymentRequest = request.json();

  return NextResponse.json("OK");
};
