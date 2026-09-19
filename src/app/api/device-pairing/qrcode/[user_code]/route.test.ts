import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { GET } from "./route";

vi.mock("qrcode", () => ({
    default: { toBuffer: vi.fn() },
}));

const buildRequest = () => new NextRequest("http://localhost/api/device-pairing/qrcode/ABCD-EFGH");

describe("GET /api/device-pairing/qrcode/[user_code]", () => {
    it("returns a PNG image encoding the approval URL for the given user_code", async () => {
        vi.mocked(QRCode.toBuffer).mockResolvedValue(Buffer.from("fake-png") as any);
        process.env.VERCEL_URL = "example.vercel.app";

        const response = await GET(buildRequest(), {
            params: Promise.resolve({ user_code: "ABCD-EFGH" }),
        });

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("image/png");
        expect(QRCode.toBuffer).toHaveBeenCalledWith(
            expect.stringContaining("/login/approve/ABCD-EFGH"),
            expect.objectContaining({ type: "png" }),
        );
    });

    it("returns a 500 without leaking internals on failure", async () => {
        vi.mocked(QRCode.toBuffer).mockRejectedValue(new Error("boom"));
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        const response = await GET(buildRequest(), {
            params: Promise.resolve({ user_code: "ABCD-EFGH" }),
        });
        const body = await response.text();

        expect(response.status).toBe(500);
        expect(body).not.toContain("boom");
        errorSpy.mockRestore();
    });
});
