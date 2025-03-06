import { NextRequest, NextResponse } from "next/server";
import { IPaymentRequestConfirmed } from "../swish-utils";
import GlobalConstants from "../../../GlobalConstants";
import { SwishConstants } from "../../../lib/swish-constants";
import { defaultActionState } from "../../../ui/form/Form";
import { addEventParticipant } from "../../../lib/event-actions";
import { assignTasksToUser } from "../../../lib/task-actions";

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
        const userId = new URL(request.url).searchParams.get(GlobalConstants.USER_ID);
        const eventId = new URL(request.url).searchParams.get(GlobalConstants.EVENT_ID);
        const taskIds = new URL(request.url).searchParams.getAll(GlobalConstants.TASK_ID);
        await addEventParticipant(userId, eventId, defaultActionState);
        await assignTasksToUser(userId, taskIds, defaultActionState);
    } else {
        // Error handling
    }
    return NextResponse.json("OK");
};
