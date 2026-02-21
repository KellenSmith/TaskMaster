import { describe, it, expect, vi, beforeEach } from "vitest";
import proxy from "./proxy";
import { NextResponse } from "next/server.js";
import GlobalConstants from "./app/GlobalConstants";
import { auth } from "./app/lib/auth/auth";

const mockNextResponseHeaders: Record<string, string> = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-DNS-Prefetch-Control": "off",
    "X-Download-Options": "noopen",
    "X-Permitted-Cross-Domain-Policies": "none",
};
const mockNextResponse = {
    headers: {
        get: vi.fn((key: string) => mockNextResponseHeaders[key]),
        has: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    },
};

vi.mock("next/server", () => ({
    NextResponse: {
        next: vi.fn(() => ({ ...mockNextResponse })),
        redirect: vi.fn(() => ({ ...mockNextResponse })),
    },
    NextRequest: {},
}));
vi.mock("./app/lib/auth/auth", () => ({
    auth: vi.fn().mockResolvedValue({ user: null }),
}));

let req = {
    url: "https://example.com/",
    method: "GET",
    nextUrl: { pathname: "/", search: "", origin: "https://example.com" },
    headers: {
        get: vi.fn(() => "application/json"),
        has: vi.fn(() => false),
    } as any,
};

describe("proxy default export", () => {
    beforeEach(() => {
        req = { ...req };
    });

    it("should allow access to /api/ticket-qrcode", async () => {
        req.nextUrl.pathname = "/api/ticket-qrcode";

        const proxyResult = await proxy(req as any);

        expect(proxyResult).toStrictEqual(NextResponse.next());
    });

    it("should bypass for server actions POST", async () => {
        req.method = "POST";
        req.headers.has = vi.fn((key) => key === "next-action");
        req.nextUrl.pathname = "/members";

        const proxyResult = await proxy(req as any);

        expect(proxyResult).toStrictEqual(NextResponse.next());
    });

    it("should redirect unauthenticated users to login from private routes", async () => {
        vi.mocked(auth).mockResolvedValue(null as any);
        req.nextUrl.pathname = `/${GlobalConstants.CALENDAR}`;

        const proxyResult = await proxy(req as any);

        expect(proxyResult).toStrictEqual(
            NextResponse.redirect(
                `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/${GlobalConstants.LOGIN}`,
            ),
        );
    });

    it("should redirect unauthorized users to home", async () => {
        // Mock NextAuth to return a user
        vi.mocked(auth).mockResolvedValue({
            user: { id: "1", role: "member", status: "pending" },
        } as any);
        req.nextUrl.pathname = `/${GlobalConstants.CALENDAR}`;

        const proxyResult = await proxy(req as any);

        expect(proxyResult).toStrictEqual(
            NextResponse.redirect(
                `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/${GlobalConstants.HOME}`,
            ),
        );
    });

    it("should allow authorized users", async () => {
        vi.mocked(auth).mockResolvedValue({
            user: { id: "1", role: "member", status: "validated" },
        } as any);

        const proxyResult = await proxy(req as any);

        expect(proxyResult).toStrictEqual(NextResponse.next());
    });
});

// Test addSecurityHeaders via proxy's side effects

describe("proxy security headers", () => {
    it("should add security headers to the response", async () => {
        // Mock an authorized user
        vi.mocked(auth).mockResolvedValue({
            user: { id: "1", role: "member", status: "validated" },
        } as any);

        // Set production env to test HSTS
        process.env = { ...process.env, NODE_ENV: "production" };
        const req = {
            method: "GET",
            nextUrl: { pathname: "/members", search: "", origin: "https://example.com" },
            headers: {
                get: vi.fn(() => "application/json"),
                has: vi.fn(() => false),
            },
            url: "https://example.com/members",
        };

        const res = await proxy(req as any);

        expect(res.headers.get("Strict-Transport-Security")).toContain("max-age");
        expect(res.headers.get("X-DNS-Prefetch-Control")).toBe("off");
        expect(res.headers.get("X-Download-Options")).toBe("noopen");
        expect(res.headers.get("X-Permitted-Cross-Domain-Policies")).toBe("none");
        expect(res.headers.get("Server")).toBeUndefined();
        expect(res.headers.get("X-Powered-By")).toBeUndefined();
    });
});
