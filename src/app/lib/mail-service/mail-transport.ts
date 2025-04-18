import { createTransport } from "nodemailer";

const globalMailService = global as unknown as { mailTransport: any };

console.error(
    "SMTP_HOST",
    process.env.SMTP_HOST,
    "SMTP_PORT",
    process.env.SMTP_PORT,
    "EMAIL",
    process.env.EMAIL,
    "EMAIL_PASSWORD",
    process.env.EMAIL_PASSWORD,
);

const mailTransport =
    globalMailService.mailTransport ||
    createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: parseInt(process.env.SMTP_PORT) === 465, // true for port 465, false for other ports
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

export { mailTransport };
