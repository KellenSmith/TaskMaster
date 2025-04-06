import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import dayjs from "dayjs";
import { remindExpiringMembers } from "../../lib/mail-service/mail-service";

export const purgeStaleMembershipApplications = async (): Promise<void> => {
    const latestCreateDateIfNotStale = dayjs().subtract(
        parseInt(process.env.PURGE_STALE_APPLICATIONS),
        "d",
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
                    lt: latestCreateDateIfNotStale.toISOString(),
                },
            },
        });
        console.log(`Purged ${deleteStaleResult.count} stale membership application(s)`);
    } catch (error) {
        console.error(`Error when purging stale memberships: ${error.message}`);
    }
};

export const remindAboutExpiringMembership = async (): Promise<void> => {
    // Send reminders to members whose membership expires in X days (X set in org settings)

    // Users membership expiration date is btw X-1 and X days from now.
    // today + X-1 < expiration_date = renew + membership_duration < today + X
    //  ==> today + X-1 - membership_duration < renew
    //  ==> renew < today + X - membership_duration

    const earliestRenewDate = dayjs()
        .hour(0)
        .minute(0)
        .second(0)
        .add(
            parseInt(process.env.MEMBERSHIP_EXPIRES_REMINDER) -
                1 -
                parseInt(process.env.NEXT_PUBLIC_MEMBERSHIP_DURATION),
            "d",
        );
    const latestRenewDate = earliestRenewDate.add(1, "d");

    try {
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
        console.log(`Reminded about ${expiringUsers.length} expiring membership(s)`);
    } catch (error) {
        console.error(`Error when reminding about expiring memberships: ${error.message}`);
    }
};
