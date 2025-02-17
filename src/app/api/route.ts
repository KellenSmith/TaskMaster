/**
 * Main Cron job for the Task Manager
 *
 * NOTE:
 * Vercel hobby plan covers 2 cron jobs triggeres once/day
 * upgrade if more is needed
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { OrgSettings } from "../lib/org-settings";

const isRequestAuthorized = (request: NextRequest): boolean => {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
};

const purgeStaleMembershipApplications = async (): Promise<NextResponse> => {
  const latestCreateDateIfStale = dayjs().subtract(
    OrgSettings[GlobalConstants.PURGE_STALE_APPLICATIONS],
    "d"
  );

  /**
   * Purge all users which have not been validated (has no "membership renewed")
   * and were created earlier than the latest create date if stale
   */
  try {
    const deleteStaleResult = await prisma.user.deleteMany({
      where: {
        [GlobalConstants.MEMBERSHIP_RENEWED]: null,
        [GlobalConstants.CREATED]: {
          lt: latestCreateDateIfStale.toISOString(),
        },
      },
    });
    // TODO: Add log entry "X stale membership applications purged" or ERROR
    return NextResponse.json(
      `Purged ${deleteStaleResult.count} stale membership application(s)`
    );
  } catch {
    return NextResponse.json("Error when purging stale memberships");
  }
};

export async function GET(request: NextRequest) {
  if (!isRequestAuthorized(request)) {
    // Log unauthorized access to api for sleuthing
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  return await purgeStaleMembershipApplications();
}
