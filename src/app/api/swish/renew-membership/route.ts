import { NextRequest, NextResponse } from "next/server";
import { IPaymentRequestConfirmed } from "../swish-utils";
import GlobalConstants from "../../../GlobalConstants";
import { SwishConstants } from "../../../lib/swish-constants";
import { getUserById, updateUser } from "../../../lib/user-actions";
import { defaultActionState as defaultFormActionState } from "../../../ui/form/Form";
import { Prisma } from "@prisma/client";
import { defaultActionState as defaultDatagridActionState } from "../../../ui/Datagrid";
import dayjs from "dayjs";
import { OrgSettings } from "../../../lib/org-settings";
import { isMembershipExpired } from "../../../lib/definitions";

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
        const userId = new URL(request.url).searchParams.get(GlobalConstants.ID);
        // Update user's membership renewed date
        const userToUpdateResult = await getUserById(defaultDatagridActionState, userId);

        if (!(userToUpdateResult.status === 200))
            return new NextResponse(userToUpdateResult.errorMsg, { status: 404 });

        const userToUpdate = userToUpdateResult.result[0];

        // Extend the existing membership by the configured membership duration
        let newRenewDate = dayjs(userToUpdate[GlobalConstants.MEMBERSHIP_RENEWED])
            .add(OrgSettings[GlobalConstants.MEMBERSHIP_DURATION] as number, "d")
            .toISOString();

        if (isMembershipExpired(userToUpdate)) newRenewDate = dayjs().toISOString();

        const updatedMembershipRenewedDate: Prisma.UserUpdateInput = {
            membershipRenewed: newRenewDate,
        };

        await updateUser(userId, defaultFormActionState, updatedMembershipRenewedDate);
    } else {
        // Error handling
    }
    return NextResponse.json("OK");
};
