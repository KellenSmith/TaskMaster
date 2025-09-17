import { prisma } from "../../../../prisma/prisma-client";
import dayjs from "dayjs";
import { remindExpiringMembers } from "../../lib/mail-service/mail-service";
import { getOrganizationSettings } from "../../lib/organization-settings-actions";
import { Prisma } from "@prisma/client";

export const purgeStaleMembershipApplications = async (): Promise<void> => {
    /**
     * Purge all users which have not become members within
     * a certain timeframe after applying for membership
     */
    try {
        const orgSettings = await getOrganizationSettings();
        const deleteStaleResult = await prisma.user.deleteMany({
            where: {
                user_membership: null,
                created_at: {
                    lt: dayjs
                        .utc()
                        .subtract(orgSettings?.purge_members_after_days_unvalidated || 7, "d")
                        .toISOString(),
                },
            },
        });
        console.log(`Purged ${deleteStaleResult.count} stale membership application(s)`);
    } catch (error) {
        console.error(`Error when purging stale memberships: ${error.message}`);
    }
};

export const remindAboutExpiringMembership = async (): Promise<void> => {
    // Send reminders to members whose membership expires in X days from now
    const orgSettings = await getOrganizationSettings();
    const reminderDays = orgSettings?.remind_membership_expires_in_days || 7;

    const earliestExpirationDate = dayjs.utc().add(reminderDays, "d").hour(0).minute(0).second(0);
    const latestExpirationDate = earliestExpirationDate.add(1, "d");

    try {
        const expiringUsers = await prisma.user.findMany({
            where: {
                user_membership: {
                    expires_at: {
                        gte: earliestExpirationDate.toISOString(),
                        lt: latestExpirationDate.toISOString(),
                    },
                },
            },
            select: { email: true },
        });
        if (expiringUsers.length > 0)
            await remindExpiringMembers(
                expiringUsers.map(
                    (user: Prisma.UserGetPayload<{ select: { email: true } }>) => user.email,
                ),
            );
        console.log(`Reminded about ${expiringUsers.length} expiring membership(s)`);
    } catch (error) {
        console.error(`Error when reminding about expiring memberships: ${error.message}`);
    }
};
