import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import dayjs from "dayjs";
import { OrgSettings } from "../../lib/org-settings";
import { remindExpiringMembers } from "../../lib/mail-service/mail-service";

export const purgeStaleMembershipApplications = async (): Promise<string> => {
    const latestCreateDateIfNotStale = dayjs().subtract(
        OrgSettings[GlobalConstants.PURGE_STALE_APPLICATIONS] as number,
        "d",
    );

    /**
     * Purge all users which have not been validated (has no "membership renewed")
     * and were created earlier than the latest create date if stale
     */
    const deleteStaleResult = await prisma.user.deleteMany({
        where: {
            [GlobalConstants.MEMBERSHIP_RENEWED]: null,
            [GlobalConstants.CREATED]: {
                lt: latestCreateDateIfNotStale.toISOString(),
            },
        },
    });
    // TODO: Add log entry "X stale membership applications purged" or ERROR
    return `Purged ${deleteStaleResult.count} stale membership application(s)`;
};

export const remindAboutExpiringMembership = async (): Promise<string> => {
    // Send reminders to members whose membership expires in X days (X set in org settings)

    // Users membership expiration date is btw X-1 and X days from now.
    // today + X-1 < expiration_date = renew + membership_duration < today + X
    //  ==> today + X-1 - membership_duration < renew
    //  ==> renew < today + X - membership_duration

    const earliestRenewDate = dayjs().add(
        (OrgSettings[GlobalConstants.MEMBERSHIP_EXPIRES_REMINDER] as number) -
            1 -
            (OrgSettings[GlobalConstants.MEMBERSHIP_DURATION] as number),
        "d",
    );
    const latestRenewDate = earliestRenewDate.add(1, "d");

    const expiringUsers = await prisma.user.findMany({
        where: {
            [GlobalConstants.MEMBERSHIP_RENEWED]: {
                gt: earliestRenewDate.toISOString(),
                lt: latestRenewDate.toISOString(),
            },
        },
    });
    if (expiringUsers.length > 0)
        await remindExpiringMembers(expiringUsers.map((user) => user[GlobalConstants.EMAIL]));
    return `Reminded about ${expiringUsers.length} expiring membership(s)`;
};
