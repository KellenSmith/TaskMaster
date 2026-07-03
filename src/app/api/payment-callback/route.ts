import { NextRequest, NextResponse } from "next/server";
import { checkPaymentStatus } from "../../lib/payment-actions";
import { prisma } from "../../../prisma/prisma-client";

const getClientIp = (request: NextRequest): string | null => {
    // Try multiple headers for better IP detection
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const xRealIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    // Use the first available IP, preferring Cloudflare's header
    return cfConnectingIp || xRealIp || xForwardedFor?.split(",")[0]?.trim() || null;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const orderId = request.nextUrl.searchParams.get("orderId");
        if (!orderId) throw new Error("Missing orderId parameter");

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
        if (!order.user_id) throw new Error("Order has no associated user");
        const errorMsg = await checkPaymentStatus(order.user_id, orderId);
        if (errorMsg) throw new Error(`Payment check failed: ${errorMsg}`);
        console.log(`Order ${orderId} status verified and updated via GET request`);

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        const clientIp = getClientIp(request);
        console.error(
            `Payment callback error from IP ${clientIp}:`,
            error instanceof Error ? error.message : String(error),
        );
        // Don't expose internal error details to external callers
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
