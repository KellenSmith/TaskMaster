import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../../../../prisma/prisma-client";
import { POST } from "./route";

const buildRequest = (device_code: unknown) =>
    new NextRequest("http://localhost/api/device-pairing/status", {
        method: "POST",
        body: JSON.stringify({ device_code }),
        headers: { "Content-Type": "application/json" },
    });

describe("POST /api/device-pairing/status", () => {
    it("returns pending for an unexpired, unconfirmed request", async () => {
        vi.mocked(prisma.devicePairingRequest.findUnique).mockResolvedValue({
            status: "pending",
            expires_at: new Date(Date.now() + 60_000),
        } as any);

        const response = await POST(buildRequest("device-code"));
        const body = await response.json();

        expect(body).toEqual({ status: "pending" });
    });

    it("returns confirmed once approved", async () => {
        vi.mocked(prisma.devicePairingRequest.findUnique).mockResolvedValue({
            status: "confirmed",
            expires_at: new Date(Date.now() + 60_000),
        } as any);

        const response = await POST(buildRequest("device-code"));
        const body = await response.json();

        expect(body).toEqual({ status: "confirmed" });
    });

    it("returns expired once the TTL has passed, even if confirmed", async () => {
        vi.mocked(prisma.devicePairingRequest.findUnique).mockResolvedValue({
            status: "confirmed",
            expires_at: new Date(Date.now() - 1000),
        } as any);

        const response = await POST(buildRequest("device-code"));
        const body = await response.json();

        expect(body).toEqual({ status: "expired" });
    });

    it("returns not_found for an unknown code", async () => {
        vi.mocked(prisma.devicePairingRequest.findUnique).mockResolvedValue(null);

        const response = await POST(buildRequest("unknown-code"));
        const body = await response.json();

        expect(body).toEqual({ status: "not_found" });
    });

    it("returns not_found without querying the database for malformed input", async () => {
        const response = await POST(buildRequest(undefined));
        const body = await response.json();

        expect(body).toEqual({ status: "not_found" });
        expect(prisma.devicePairingRequest.findUnique).not.toHaveBeenCalled();
    });

    it("never leaks user_id, ip or user-agent in the response", async () => {
        vi.mocked(prisma.devicePairingRequest.findUnique).mockResolvedValue({
            status: "confirmed",
            expires_at: new Date(Date.now() + 60_000),
        } as any);

        const response = await POST(buildRequest("device-code"));
        const body = await response.json();

        expect(Object.keys(body)).toEqual(["status"]);
        expect(prisma.devicePairingRequest.findUnique).toHaveBeenCalledWith({
            where: { device_code: "device-code" },
            select: { status: true, expires_at: true },
        });
    });
});
