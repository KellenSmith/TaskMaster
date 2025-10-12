import { NextRequest, NextResponse } from "next/server";
import { checkPaymentStatus } from "../../lib/payment-actions";
import { prisma } from "../../../../prisma/prisma-client";

const getClientIp = (request: NextRequest): string | null => {
    // Try multiple headers for better IP detection
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const xRealIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    // Use the first available IP, preferring Cloudflare's header
    return cfConnectingIp || xRealIp || xForwardedFor?.split(",")[0]?.trim() || null;
};

const isAllowedIp = (request: NextRequest): boolean => {
    const clientIp = getClientIp(request);
    if (!clientIp) {
        console.warn("No client IP found in headers");
        return false;
    }

    // Updated IP ranges per Swedbank Pay documentation (March 12th 2025)
    const allowedIps = [
        // Legacy IPs (still valid)
        "51.107.183.58",
        "91.132.170.1",
        // New IP range: 20.91.170.120–127 (20.91.170.120/29)
        "20.91.170.120",
        "20.91.170.121",
        "20.91.170.122",
        "20.91.170.123",
        "20.91.170.124",
        "20.91.170.125",
        "20.91.170.126",
        "20.91.170.127",
    ];

    const isAllowed = allowedIps.includes(clientIp);
    if (!isAllowed) {
        console.warn(`Blocked request from IP: ${clientIp}`);
    }

    return isAllowed;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
    const clientIp = getClientIp(request);

    if (!isAllowedIp(request)) {
        console.error(
            `Unauthorized payment callback attempt from IP: ${clientIp}, Referrer: ${request.headers.get("referer")}`,
        );
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const orderId = request.nextUrl.searchParams.get("orderId");

        // ✅ SECURITY: Simple idempotency check to prevent duplicate processing
        const order = await prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            select: {
                user_id: true,
                status: true,
                updated_at: true,
            },
        });

        // Skip if order is already completed
        if (order.status === "completed") {
            console.log(`Order ${orderId} already completed, ignoring callback`);
            return new NextResponse("OK", { status: 200 });
        }

        // Simple rate limiting: skip if updated very recently (prevents spam)
        const timeSinceLastUpdate = Date.now() - new Date(order.updated_at).getTime();
        if (timeSinceLastUpdate < 10000) {
            // 10 seconds cooldown
            console.log(`Order ${orderId} updated recently, rate limiting callback`);
            return new NextResponse("OK", { status: 200 });
        }

        // Process the payment check as normal
        await checkPaymentStatus(order.user_id, orderId);
        console.log(`Order ${orderId} status verified and updated via GET request`);

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error(`Payment callback error from IP ${clientIp}:`, error);
        // Don't expose internal error details to external callers
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
