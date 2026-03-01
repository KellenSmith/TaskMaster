"use client";

import { useEffect } from "react";
import { processNextNewsletterBatch } from "./lib/mail-service/newsletter-actions";

export const NEWSLETTER_PROCESS_INTERVAL = 60 * 1000; // 1 minute

const NewsletterTrigger: React.FC = () => {
    const processNewsletterAction = () => {
        try {
            processNextNewsletterBatch();
        } catch {
            // // Ignore errors - this is a best-effort trigger and will retry after interval
        }
    };

    useEffect(() => {
        processNewsletterAction(); // Call on mount
        // Call every interval after that
        const interval = setInterval(() => {
            processNewsletterAction();
        }, NEWSLETTER_PROCESS_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    return null; // This component doesn't render anything
};

export default NewsletterTrigger;
