import { NextRequest, NextResponse } from "next/server";
import { IPaymentRequestConfirmed } from "../swish-utils";
import GlobalConstants from "../../../GlobalConstants";
import { SwishConstants } from "../../../lib/swish-constants";
import { updateUser } from "../../../lib/actions";
import { defaultActionState } from "../../../ui/form/Form";

/**
 * Run this serverless fcn in nodejs env to enable configuring
 * TLS certs to access Swish endpoints.
 */
export const config = {
    runtime: "nodejs",
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
    // TODO: Verify caller ID
    const confirmedPaymentRequest: IPaymentRequestConfirmed = await request.json();
    // TODO: Verify swish caller ID
    if (confirmedPaymentRequest.status === SwishConstants.PAID) {
        // Update user's membership renewed date
        const updatedMembershipRenewedDate = new FormData();
        updatedMembershipRenewedDate.append(
            GlobalConstants.MEMBERSHIP_RENEWED,
            confirmedPaymentRequest.datePaid,
        );
        const userId = new URL(request.url).searchParams.get(GlobalConstants.ID);
        await updateUser(userId, defaultActionState, updatedMembershipRenewedDate);
    } else {
        // Error handling
    }
    return NextResponse.json("OK");
};
