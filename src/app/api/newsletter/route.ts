import { NextRequest, NextResponse } from "next/server";
import { createNewsletterJob } from "../../lib/mail-service/newsletter-actions";

const isAuthorized = (req: NextRequest) =>
    req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

export async function POST(request: NextRequest) {
    if (!isAuthorized(request)) return new NextResponse("Unauthorized", { status: 401 });
    try {
        const body = await request.json();
        const { subject, html, recipients, batchSize, perRecipient } = body || {};
        const result = await createNewsletterJob({
            subject,
            html,
            recipients,
            batchSize,
            perRecipient,
        });
        return NextResponse.json(result);
    } catch (err: any) {
        return new NextResponse(err?.message || "Error", { status: 400 });
    }
}
