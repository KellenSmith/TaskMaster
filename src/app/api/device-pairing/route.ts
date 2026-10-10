import { NextRequest, NextResponse } from "next/server";
import dayjs from "dayjs";
import { prisma } from "../../../prisma/prisma-client";
import {
    DEVICE_PAIRING_TTL_MINUTES,
    generateDeviceCode,
    generateUserCode,
    getClientIp,
} from "../../lib/device-pairing-helpers";

const CREATE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CREATE_RATE_LIMIT_MAX_REQUESTS = 5;

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const clientIp = getClientIp(request);

        // Rate-limit even when no IP could be determined - requests with no signal
        // share a single bucket (requesting_ip IS NULL) rather than skipping the
        // check entirely, which would otherwise be an unlimited bypass.
        const recentRequestCount = await prisma.devicePairingRequest.count({
            where: {
                requesting_ip: clientIp,
                created_at: { gt: new Date(Date.now() - CREATE_RATE_LIMIT_WINDOW_MS) },
            },
        });
        if (recentRequestCount >= CREATE_RATE_LIMIT_MAX_REQUESTS) {
            return new NextResponse("Too Many Requests", { status: 429 });
        }

        const expiresAt = dayjs.utc().add(DEVICE_PAIRING_TTL_MINUTES, "minute").toDate();
        const pairingRequest = await prisma.devicePairingRequest.create({
            data: {
                device_code: generateDeviceCode(),
                user_code: generateUserCode(),
                expires_at: expiresAt,
                requesting_user_agent: request.headers.get("user-agent"),
                requesting_ip: clientIp,
            },
            select: { device_code: true, user_code: true, expires_at: true },
        });

        return NextResponse.json(pairingRequest);
    } catch (error) {
        console.error("Error creating device pairing request:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
