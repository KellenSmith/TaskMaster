import { NextResponse } from "next/server";
import { createPaymentRequest } from "./swish-utils";
import GlobalConstants from "../../GlobalConstants";
import { OrgSettings } from "../../lib/org-settings";

/**
 * Run this serverless fcn in nodejs env to enable configuring
 * TLS certs to access Swish endpoints.
 */
export const config = {
  runtime: "nodejs",
};

export const GET = async () => {
  const resp = await createPaymentRequest(
    OrgSettings[GlobalConstants.MEMBERSHIP_FEE] as number,
    "swish message"
  );

  return NextResponse.json(resp || null);
};
