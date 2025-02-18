import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { swish } from "./swish-client";

/**
 * Run this serverless fcn in nodejs env to enable configuring
 * TLS certs to access Swish endpoints.
 */
export const config = {
  runtime: "nodejs",
};

export async function GET(request: NextRequest) {
  // Lowercase and "-" disallowed by Swish
  const instructionId = uuidv4().toUpperCase().replaceAll("-", "");

  // Setup the data object for the payment
  const data = {
    payeePaymentReference: "0123456789",
    callbackUrl: "https://example.com/swishcallback",
    payeeAlias: "1234679304",
    currency: "SEK",
    payerAlias: "4671234768",
    amount: "100",
    message: "Kingston USB Flash Drive 8 GB",
    callbackIdentifier: "11A86BE70EA346E4B1C39C874173F478",
  };

  try {
    const resp = await swish.put(
      `https://mss.cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests/${instructionId}`,
      data
    );
    console.log("Payment request created: ", resp);
  } catch (error) {
    console.log(error);
  }
  return NextResponse.json("success");
}
