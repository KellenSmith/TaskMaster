import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../../prisma/prisma-client";
import {
    generateDeviceCode,
    generateUserCode,
    getClientIp,
    getDevicePairingRequestByUserCode,
} from "./device-pairing-helpers";

describe("device-pairing-helpers", () => {
    describe("generateUserCode", () => {
        it("generates an 8-character code split into two groups of 4 with an unambiguous alphabet", () => {
            const code = generateUserCode();
            expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
            expect(code).not.toMatch(/[0O1IL]/);
        });

        it("generates different codes across calls", () => {
            const codes = new Set(Array.from({ length: 20 }, () => generateUserCode()));
            expect(codes.size).toBeGreaterThan(1);
        });
    });

    describe("generateDeviceCode", () => {
        it("generates a high-entropy base64url string", () => {
            const code = generateDeviceCode();
            expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
            expect(code.length).toBeGreaterThanOrEqual(40);
        });
    });

    describe("getClientIp", () => {
        const buildRequest = (headers: Record<string, string>) =>
            new NextRequest("http://localhost/api/device-pairing", { headers });

        it("ignores cf-connecting-ip and x-real-ip - both are attacker-controlled here", () => {
            const request = buildRequest({
                "cf-connecting-ip": "1.1.1.1",
                "x-real-ip": "2.2.2.2",
                "x-forwarded-for": "3.3.3.3",
            });
            expect(getClientIp(request)).toBe("3.3.3.3");
        });

        it("uses the last hop of x-forwarded-for, not the client-controlled first hop", () => {
            const request = buildRequest({ "x-forwarded-for": "3.3.3.3, 4.4.4.4" });
            expect(getClientIp(request)).toBe("4.4.4.4");
        });

        it("returns null when x-forwarded-for is absent, even if other IP headers are present", () => {
            const request = buildRequest({ "x-real-ip": "2.2.2.2", "cf-connecting-ip": "1.1.1.1" });
            expect(getClientIp(request)).toBeNull();
        });

        it("returns null when no IP headers are present", () => {
            const request = buildRequest({});
            expect(getClientIp(request)).toBeNull();
        });
    });

    describe("getDevicePairingRequestByUserCode", () => {
        it("returns safe display fields when the request exists and is unexpired", async () => {
            const expires_at = new Date(Date.now() + 60_000);
            vi.mocked(prisma.devicePairingRequest.findUnique).mockResolvedValue({
                status: "pending",
                requesting_user_agent: "Chrome on Windows",
                expires_at,
            } as any);

            const result = await getDevicePairingRequestByUserCode("ABCD-EFGH");

            expect(result).toEqual({
                status: "pending",
                requesting_user_agent: "Chrome on Windows",
                expires_at,
            });
            expect(prisma.devicePairingRequest.findUnique).toHaveBeenCalledWith({
                where: { user_code: "ABCD-EFGH" },
                select: { status: true, requesting_user_agent: true, expires_at: true },
            });
        });

        it("returns null when no request is found", async () => {
            vi.mocked(prisma.devicePairingRequest.findUnique).mockResolvedValue(null);

            const result = await getDevicePairingRequestByUserCode("ABCD-EFGH");

            expect(result).toBeNull();
        });

        it("returns null when the request has expired", async () => {
            vi.mocked(prisma.devicePairingRequest.findUnique).mockResolvedValue({
                status: "pending",
                requesting_user_agent: null,
                expires_at: new Date(Date.now() - 1000),
            } as any);

            const result = await getDevicePairingRequestByUserCode("ABCD-EFGH");

            expect(result).toBeNull();
        });
    });
});
