import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../../../prisma/prisma-client";
import { POST } from "./route";

const buildRequest = (headers: Record<string, string> = {}) =>
    new NextRequest("http://localhost/api/device-pairing", { method: "POST", headers });

describe("POST /api/device-pairing", () => {
    it("creates a pairing request and returns the codes and expiry", async () => {
        vi.mocked(prisma.devicePairingRequest.count).mockResolvedValue(0);
        vi.mocked(prisma.devicePairingRequest.create).mockImplementation(
            (({ data, select }: any) => {
                expect(select).toEqual({ device_code: true, user_code: true, expires_at: true });
                expect(data.device_code).toBeTruthy();
                expect(data.user_code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
                return Promise.resolve({
                    device_code: data.device_code,
                    user_code: data.user_code,
                    expires_at: data.expires_at,
                });
            }) as any,
        );

        const response = await POST(buildRequest({ "x-forwarded-for": "1.2.3.4" }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.user_code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
        expect(body.device_code).toBeTruthy();
    });

    it("rate-limits repeated requests from the same IP", async () => {
        vi.mocked(prisma.devicePairingRequest.count).mockResolvedValue(5);

        const response = await POST(buildRequest({ "x-forwarded-for": "1.2.3.4" }));

        expect(response.status).toBe(429);
        expect(prisma.devicePairingRequest.create).not.toHaveBeenCalled();
    });

    it("returns a generic 500 on unexpected failure without leaking internals", async () => {
        vi.mocked(prisma.devicePairingRequest.count).mockRejectedValue(new Error("db down"));
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        const response = await POST(buildRequest());
        const body = await response.text();

        expect(response.status).toBe(500);
        expect(body).not.toContain("db down");
        errorSpy.mockRestore();
    });
});
