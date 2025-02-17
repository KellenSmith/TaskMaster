import { Resend } from "resend";

const globalForResend = global as unknown as { resend: Resend };

const resend = globalForResend.resend || new Resend(process.env.RESEND_API_KEY);

export { resend };
