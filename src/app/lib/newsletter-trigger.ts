// Newsletter processing trigger utility for Edge Runtime
// This handles background newsletter processing triggered by user activity

import { getAbsoluteUrl } from "./utils";

let lastNewsletterCheck = 0;
const NEWSLETTER_CHECK_INTERVAL = 60 * 1000; // 1 minute in milliseconds

/**
 * Triggers newsletter batch processing via internal API call.
 * This works in Edge Runtime by making a fetch request to the existing API endpoint.
 *
 * @param forceCheck - Skip rate limiting (used by cron jobs)
 */
export async function triggerNewsletterProcessing(forceCheck = false): Promise<void> {
    const now = Date.now();

    // Check if we should process (rate limiting)
    if (!forceCheck && now - lastNewsletterCheck < NEWSLETTER_CHECK_INTERVAL) {
        return; // Too soon, skip this trigger
    }

    // Update timestamp first to prevent multiple simultaneous calls
    lastNewsletterCheck = now;

    try {
        // Use the existing newsletter process API endpoint
        const response = await fetch(getAbsoluteUrl(["api/newsletter/process"]), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.CRON_SECRET}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}), // No specific jobId - process next pending job
        });

        if (response.ok) {
            const result = await response.json();
            if (result.processed > 0) {
                console.log(
                    `Background newsletter processing: sent to ${result.processed} recipients${result.done ? " (job completed)" : ""}`,
                );
            }
        } else {
            console.warn(
                `Newsletter processing API returned ${response.status}: ${response.statusText}`,
            );
            // Reset timestamp on error so we can retry sooner
            lastNewsletterCheck = now - NEWSLETTER_CHECK_INTERVAL / 2;
        }
    } catch (error) {
        console.error("Failed to trigger newsletter processing:", error);
        // Reset timestamp on error
        lastNewsletterCheck = now - NEWSLETTER_CHECK_INTERVAL / 2;
    }
}

/**
 * Gets the seconds remaining until the next newsletter check is allowed
 */
export function getSecondsUntilNextNewsletterCheck(): number {
    const now = Date.now();
    const elapsed = now - lastNewsletterCheck;
    const remaining = NEWSLETTER_CHECK_INTERVAL - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Checks if newsletter processing is currently rate limited
 */
export function isNewsletterProcessingRateLimited(): boolean {
    const now = Date.now();
    return now - lastNewsletterCheck < NEWSLETTER_CHECK_INTERVAL;
}
