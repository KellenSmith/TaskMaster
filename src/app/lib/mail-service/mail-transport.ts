// Avoid importing nodemailer at module evaluation time. Dynamically import it
// inside getMailTransport so bundlers don't include Node-only modules in edge

// bundles.
import type { Transporter } from "nodemailer";
const globalMailService = global as { mailTransport?: Transporter }; // Transporter type from nodemailer

export async function getMailTransport(): Promise<Transporter> {
    if (!process.env.SMTP_PORT || !process.env.SMTP_HOST || !process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
        throw new Error("Mail env var configuration is incomplete. Make sure SMTP_PORT, SMTP_HOST, EMAIL, and EMAIL_PASSWORD are all set.");
    }

    if (globalMailService.mailTransport) return globalMailService.mailTransport;

    // dynamic import so nodemailer is only required at runtime on a Node server
    const nodemailer = await import("nodemailer");
    const { createTransport } = nodemailer;

    const port = parseInt(process.env.SMTP_PORT || "0");
    const isSecure = port === 465; // port 465 = implicit TLS, 587 = STARTTLS

    const transport = createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: isSecure,
        // Force STARTTLS when using submission port 587
        requireTLS: !isSecure,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
        // Gentle connection pooling to smooth bursts and avoid throttling
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 60_000, // window in ms
        rateLimit: 100, // messages per window across the pool
        tls: {
            // Keep strict cert validation in production
            rejectUnauthorized: process.env.NODE_ENV === "production",
        },
    });

    globalMailService.mailTransport = transport;
    return transport;
}
