/**
 * Main Cron job for the Task Manager
 *
 * NOTE:
 * Vercel hobby plan covers 2 cron jobs triggered once/day
 * upgrade if more is needed
 */

import { NextRequest, NextResponse } from "next/server";
import {
  purgeStaleMembershipApplications,
  remindAboutExpiringMembership,
} from "./cron";

const isRequestAuthorized = (request: NextRequest): boolean => {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
};

export async function GET(request: NextRequest) {
  if (!isRequestAuthorized(request)) {
    // Log unauthorized access to api for sleuthing
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  const responseBody = [];
  try {
    const purgeResponse = await purgeStaleMembershipApplications();
    // TODO: Add log entry "X stale membership applications purged" or ERROR
    responseBody.push(purgeResponse);
  } catch (error) {
    responseBody.push(`Error when purging stale memberships: ${error.message}`);
  }

  try {
    const remindResponse = await remindAboutExpiringMembership();
    responseBody.push(remindResponse);
    // TODO: Add log entry "X expiring membership reminders sent" or ERROR
  } catch (error) {
    return NextResponse.json(
      `Error when reminding about expiring memberships: ${error.message}`
    );
  }

  return NextResponse.json(responseBody);
}
