import { prisma } from "../../../prisma/prisma-client";
import dayjs from "dayjs";
import { sendMail } from "../../lib/mail-service/mail-service";
import { getOrganizationSettings } from "../../lib/organization-settings-helpers";
import MembershipExpiresReminderTemplate from "../../lib/mail-service/mail-templates/MembershipExpiresReminderTemplate";
import { createElement } from "react";
import { processNextNewsletterBatch } from "../../lib/mail-service/newsletter-actions";

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
                        .toDate(),
                },
            },
        });
        console.log(`Purged ${deleteStaleResult.count} stale membership application(s)`);
    } catch (error) {
        if (error instanceof Error)
            console.error(`Error when purging stale memberships: ${error.message}`);
        throw error;
    }
};

export const expiringMembershipMaintenance = async (): Promise<void> => {
    /**
     * Send reminders to members whose membership expires in "reminderDays" days from now
     */
    const orgSettings = await getOrganizationSettings();
    const reminderDays = orgSettings?.remind_membership_expires_in_days || 7;

    const earliestExpirationDate = dayjs.utc().add(reminderDays, "d").hour(0).minute(0).second(0);
    const latestExpirationDate = earliestExpirationDate.add(1, "d");

    const expiringUsers = await prisma.user.findMany({
        where: {
            user_membership: {
                expires_at: {
                    gte: earliestExpirationDate.toISOString(),
                    lt: latestExpirationDate.toISOString(),
                },
            },
        },
        select: {
            id: true,
            email: true,
            user_membership: { include: { membership: { include: { product: true } } } },
        },
    });

    try {
        // Send email reminders to users without active subscriptions
        if (expiringUsers.length > 0) {
            await sendMail(
                expiringUsers.map((user) => user.email),
                `Your ${process.env.NEXT_PUBLIC_ORG_NAME || "Task Master"} membership is about to expire`,
                createElement(MembershipExpiresReminderTemplate),
            );
        }
        console.log(`Reminded about ${expiringUsers.length} expiring membership(s)`);
    } catch (error) {
        if (error instanceof Error)
            console.error(`Error when reminding about expiring memberships: ${error.message}`);
        throw error;
    }
};

export const processNewsletterBacklog = async (): Promise<void> => {
    /**
     * Process newsletter jobs efficiently within Vercel's 1-minute cron limit.
     * This ensures newsletters get sent even if there's no user activity.
     */
    try {
        let processed = 0;
        let attempts = 0;
        const startTime = Date.now();
        const maxDuration = 45 * 1000; // 45 seconds max to stay well under 1-minute limit

        // Keep processing until no more jobs, we hit limits, or run out of time
        while (true) {
            // Check if we're approaching time limit
            if (Date.now() - startTime > maxDuration) {
                console.log(
                    `Newsletter cron stopping due to time limit after processing ${processed} recipients across ${attempts} batches`,
                );
                break;
            }

            const result = await processNextNewsletterBatch();

            processed += result.processed;
            attempts += 1;

            if (result.processed === 0 || result.done) {
                break; // No more work to do
            }

            // No delays between batches to maximize processing within time limit
        }
        if (processed === 0) {
            console.log(`No pending newsletter jobs found`);
        } else if (processed > 0) {
            console.log(
                `Cron job processed ${processed} newsletter recipients across ${attempts} batches in ${Date.now() - startTime}ms`,
            );
        }
    } catch (error) {
        if (error instanceof Error)
            console.error(`Error in newsletter backlog processing: ${error.message}`);
        throw error;
    }
};
