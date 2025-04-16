import { createTransport } from "nodemailer";

const globalMailService = global as unknown as { mailTransport: any };

const mailTransport =
    globalMailService.mailTransport ||
    createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false, // true for port 465, false for other ports
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

export { mailTransport };
