// Avoid importing nodemailer at module evaluation time. Dynamically import it
// inside getMailTransport so bundlers don't include Node-only modules in edge
// bundles.
const globalMailService = global as { mailTransport? };

export async function getMailTransport() {
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
