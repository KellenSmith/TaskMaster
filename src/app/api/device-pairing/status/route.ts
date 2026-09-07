import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../prisma/prisma-client";
import { DevicePairingStatus } from "../../../../prisma/generated/enums";

// device_code is the pairing secret - it must never appear in a URL (query string or
// path), since URLs are what platform/proxy/log-drain logging captures by default.
// It's read from the request body instead.
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const device_code = body?.device_code;

        if (typeof device_code !== "string" || !device_code) {
            return NextResponse.json({ status: "not_found" });
        }

        const pairingRequest = await prisma.devicePairingRequest.findUnique({
            where: { device_code },
            select: { status: true, expires_at: true },
        });

        if (!pairingRequest) {
            return NextResponse.json({ status: "not_found" });
        }
        if (pairingRequest.expires_at.getTime() < Date.now()) {
            return NextResponse.json({ status: "expired" });
        }
        if (pairingRequest.status === DevicePairingStatus.confirmed) {
            return NextResponse.json({ status: "confirmed" });
        }
        return NextResponse.json({ status: "pending" });
    } catch (error) {
        console.error("Error polling device pairing request:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
