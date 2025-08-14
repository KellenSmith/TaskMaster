import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import dayjs from "dayjs";
import { remindExpiringMembers } from "../../lib/mail-service/mail-service";
import { getOrganizationSettings } from "../../lib/organization-settings-actions";

export const purgeStaleMembershipApplications = async (): Promise<void> => {
    /**
     * Purge all users which have not become members within
     * a certain timeframe after applying for membership
     */
    try {
        const deleteStaleResult = await prisma.user.deleteMany({
            where: {
                userMembership: null,
                createdAt: {
                    lt: dayjs()
                        .subtract(parseInt(process.env.PURGE_STALE_APPLICATIONS), "d")
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
    const reminderDays = orgSettings?.remindMembershipExpiresInDays || 7;

    const earliestExpirationDate = dayjs().add(reminderDays, "d").hour(0).minute(0).second(0);
    const latestExpirationDate = earliestExpirationDate.add(1, "d");

    try {
        const expiringUsers = await prisma.user.findMany({
            where: {
                userMembership: {
                    expiresAt: {
                        gte: earliestExpirationDate.toISOString(),
                        lt: latestExpirationDate.toISOString(),
                    },
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
