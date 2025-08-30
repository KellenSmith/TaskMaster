import { Transporter } from "nodemailer";
import { getOrganizationSettings } from "../organization-settings-actions";

// Avoid importing nodemailer at module evaluation time. Dynamically import it
// inside getMailTransport so bundlers don't include Node-only modules in edge
// bundles.
const globalMailService = global as { mailTransport? };

export async function getMailTransport() {
    if (globalMailService.mailTransport) return globalMailService.mailTransport;

    const orgSettings = await getOrganizationSettings();

    // dynamic import so nodemailer is only required at runtime on a Node server
    const nodemailer = await import("nodemailer");
    const { createTransport } = nodemailer;

    const transport = createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "0"),
        secure: parseInt(process.env.SMTP_PORT || "0") === 465,
        auth: {
            user: orgSettings?.organization_email,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === "production",
        },
    });

    globalMailService.mailTransport = transport;
    return transport;
}
