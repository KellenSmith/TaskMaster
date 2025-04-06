/**
 * Main Cron job for the Task Manager
 *
 * NOTE:
 * Vercel hobby plan covers 2 cron jobs triggered once/day
 * upgrade if more is needed
 */

import { NextRequest, NextResponse } from "next/server";
import { purgeStaleMembershipApplications, remindAboutExpiringMembership } from "./cron";

const isRequestAuthorized = (request: NextRequest): boolean => {
    const authHeader = request.headers.get("authorization");
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
};

export async function GET(request: NextRequest) {
    if (!isRequestAuthorized(request)) {
        // Log unauthorized access to api for sleuthing
        console.warn(`Unauthorized access: ${request}`);
        return new NextResponse("Unauthorized", {
            status: 401,
        });
    }

    await purgeStaleMembershipApplications();

    await remindAboutExpiringMembership();
    return new NextResponse("OK", {
        status: 200,
    });
}
