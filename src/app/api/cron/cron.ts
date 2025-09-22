import { prisma } from "../../../../prisma/prisma-client";
import dayjs from "dayjs";
import { sendMail } from "../../lib/mail-service/mail-service";
import { getOrganizationSettings } from "../../lib/organization-settings-actions";
import { Prisma } from "@prisma/client";
import MembershipExpiresReminderTemplate from "../../lib/mail-service/mail-templates/MembershipExpiresReminderTemplate";
import { createElement } from "react";
import { processNextNewsletterBatch } from "../../lib/mail-service/newsletter-actions";
import { userHasActiveMembershipSubscription } from "../../ui/utils";
import { createOrder } from "../../lib/order-actions";
import {
    checkPaymentStatus,
    createSwedbankPaymentRequest,
    getSwedbankPaymentRequestPurchasePayload,
} from "../../lib/payment-actions";
import { SubscriptionToken } from "../../lib/payment-utils";

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

const chargeMembershipWithActiveSubscriptions = async (
    user: Prisma.UserGetPayload<{
        include: { user_membership: { include: { membership: { include: { product: true } } } } };
    }>,
): Promise<void> => {
    const subscriptionToken = user.user_membership?.subscription_token;
    const membershipOrderItem = {
        quantity: 1,
        product_id: user.user_membership.membership.product_id,
        price: user.user_membership.membership.product.price,
    } as Prisma.OrderItemCreateManyOrderInput;
    const membershipOrder = await createOrder(user.id, [membershipOrderItem]);
    const paymentRequestPayload = await getSwedbankPaymentRequestPurchasePayload(
        membershipOrder.id,
    );
    paymentRequestPayload.paymentorder.unscheduledToken = subscriptionToken as SubscriptionToken;
    const { paymentOrderId } = await createSwedbankPaymentRequest(paymentRequestPayload);
    if (paymentOrderId) await checkPaymentStatus(user.id, membershipOrder.id, paymentOrderId);
};

export const expiringMembershipMaintenance = async (): Promise<void> => {
    /**
     * 1. Send reminders to members whose membership expires in X days from now
     * 2. Auto-renew memberships for members with active subscriptions
     */
    const orgSettings = await getOrganizationSettings();
    const reminderDays = orgSettings?.remind_membership_expires_in_days || 7;

    const earliestExpirationDate = dayjs.utc().add(reminderDays, "d").hour(0).minute(0).second(0);
    const latestExpirationDate = earliestExpirationDate.add(1, "d");

    try {
        const expiringUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { email: "ecomintegration@swedbankpay.com" },
                    {
                        user_membership: {
                            expires_at: {
                                gte: earliestExpirationDate.toISOString(),
                                lt: latestExpirationDate.toISOString(),
                            },
                        },
                    },
                ],
            },
            select: {
                email: true,
                user_membership: { include: { membership: { include: { product: true } } } },
            },
        });

        const usersWithSubscriptions = expiringUsers.filter((user) =>
            userHasActiveMembershipSubscription(user),
        );
        await Promise.all(
            usersWithSubscriptions.map((user) => chargeMembershipWithActiveSubscriptions(user)),
        ).then(() => console.log(`Auto-renewed ${usersWithSubscriptions.length} memberships`));

        const usersWithoutSubscriptions = expiringUsers.filter(
            (user) => !userHasActiveMembershipSubscription(user),
        );
        // Send email reminders to users without active subscriptions
        if (usersWithoutSubscriptions.length > 0) {
            await sendMail(
                usersWithoutSubscriptions.map((user) => user.email),
                `Your ${process.env.NEXT_PUBLIC_ORG_NAME || "Task Master"} membership is about to expire`,
                createElement(MembershipExpiresReminderTemplate),
            );
        }

        console.log(`Reminded about ${expiringUsers.length} expiring membership(s)`);
    } catch (error) {
        console.error(`Error when reminding about expiring memberships: ${error.message}`);
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
        const maxAttempts = 5; // Reduced for 1-minute limit
        const startTime = Date.now();
        const maxDuration = 45 * 1000; // 45 seconds max to stay well under 1-minute limit

        // Keep processing until no more jobs, we hit limits, or run out of time
        while (attempts < maxAttempts) {
            // Check if we're approaching time limit
            if (Date.now() - startTime > maxDuration) {
                console.log(
                    `Newsletter cron stopping due to time limit after ${attempts} attempts`,
                );
                break;
            }

            const result = await processNextNewsletterBatch();

            if (result.processed === 0 || result.done) {
                break; // No more work to do
            }

            processed += result.processed;
            attempts++;

            // No delays between batches to maximize processing within time limit
        }

        if (processed > 0) {
            console.log(
                `Cron job processed ${processed} newsletter recipients across ${attempts} batches in ${Date.now() - startTime}ms`,
            );
        } else if (attempts === 0) {
            console.log(`No pending newsletter jobs found`);
        }
    } catch (error) {
        console.error(`Error in newsletter backlog processing: ${error.message}`);
    }
};
