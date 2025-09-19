import { NextRequest, NextResponse } from "next/server";
import { processNextNewsletterBatch } from "../../../lib/mail-service/newsletter-actions";

const isAuthorized = (req: NextRequest) => {
    const bearerOk = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
    const vercelCron = req.headers.get("x-vercel-cron");
    return bearerOk || !!vercelCron; // allow Vercel scheduled triggers
};

export async function POST(request: NextRequest) {
    if (!isAuthorized(request)) return new NextResponse("Unauthorized", { status: 401 });
    try {
        const body = await request.json().catch(() => ({}));
        const { jobId } = body || {};
        const result = await processNextNewsletterBatch(jobId);
        return NextResponse.json(result);
    } catch (err) {
        return new NextResponse(err?.message || "Error", { status: 400 });
    }
}
