import { createTransport } from "nodemailer";
import { getOrganizationSettings } from "../organization-settings-actions";

const globalMailService = global as unknown as { mailTransport: any };

const orgSettings = await getOrganizationSettings();

const mailTransport =
    globalMailService.mailTransport ||
    createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: parseInt(process.env.SMTP_PORT) === 465, // true for port 465, false for other ports
        auth: {
            user: orgSettings?.email,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === "production",
        },
    });

export { mailTransport };
