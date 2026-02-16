"use client";

import { useEffect, useState } from "react";
import { processNextNewsletterBatch } from "./lib/mail-service/newsletter-actions";

export const NEWSLETTER_PROCESS_INTERVAL = 60 * 1000; // 1 minute

const NewsletterTrigger: React.FC = () => {
    const [lastCheck, setLastCheck] = useState<number | null>(null);

    useEffect(() => {
        try {
            // Rate limit checks to once per interval
            if (lastCheck && Date.now() - lastCheck < NEWSLETTER_PROCESS_INTERVAL) return;
            processNextNewsletterBatch();
            setLastCheck(Date.now());
        } catch {
            // Ignore errors - this is a best-effort trigger and will retry on next activity
        }
    }, [lastCheck]); // No dependency array - runs on every render to maximize chances of triggering during user activity

    return null; // This component doesn't render anything
};

export default NewsletterTrigger;
