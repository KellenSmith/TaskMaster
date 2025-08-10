import { describe, it, expect, beforeEach, vi } from "vitest";
import middleware, { config } from "../middleware";
import { NextRequest } from "next/server";
import GlobalConstants from "../app/GlobalConstants";
import dayjs from "dayjs";

// Mock the dependencies
vi.mock("../app/lib/auth/auth", () => ({
    decryptJWT: vi.fn(),
}));

vi.mock("../app/lib/definitions", () => ({
    isUserAuthorized: vi.fn(),
}));

// Import the mocked modules
import { decryptJWT } from "../app/lib/auth/auth";
import { isUserAuthorized } from "../app/lib/definitions";

describe("Middleware Security", () => {
    let mockRequest: NextRequest;

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (pathname: string): NextRequest => {
        const url = new URL(`https://example.com${pathname}`);
        return new NextRequest(url);
    };

    describe("config matcher", () => {
        it("should have correct matcher pattern", () => {
            expect(config.matcher).toEqual([
                "/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)",
            ]);
        });
    });

    describe("route protection", () => {
        it("should redirect unauthorized users", async () => {
            const mockUser = null;
            vi.mocked(decryptJWT).mockResolvedValue(mockUser);
            vi.mocked(isUserAuthorized).mockReturnValue(false);

            mockRequest = createMockRequest("/profile");
            const response = await middleware(mockRequest);

            expect(decryptJWT).toHaveBeenCalled();
            expect(isUserAuthorized).toHaveBeenCalledWith("/profile", mockUser);
            expect(response.status).toBe(307); // Redirect status
            expect(response.headers.get("location")).toContain(`/${GlobalConstants.HOME}`);
        });

        it("should allow authorized users to proceed", async () => {
            const mockUser = {
                [GlobalConstants.ID]: "user123",
                [GlobalConstants.ROLE]: "member",
                [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
            };
            vi.mocked(decryptJWT).mockResolvedValue(mockUser);
            vi.mocked(isUserAuthorized).mockReturnValue(true);

            mockRequest = createMockRequest("/calendar");
            const response = await middleware(mockRequest);

            expect(decryptJWT).toHaveBeenCalled();
            expect(isUserAuthorized).toHaveBeenCalledWith("/calendar", mockUser);
            expect(response.status).toBe(200); // NextResponse.next() status
        });

        it("should redirect logged in users from login page to home", async () => {
            const mockUser = {
                [GlobalConstants.ID]: "user123",
                [GlobalConstants.ROLE]: "member",
                [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
            };
            vi.mocked(decryptJWT).mockResolvedValue(mockUser);
            vi.mocked(isUserAuthorized).mockReturnValue(true); // Even though authorized, should redirect from login

            mockRequest = createMockRequest(`/${GlobalConstants.LOGIN}`);
            const response = await middleware(mockRequest);

            expect(response.status).toBe(307); // Redirect status
            expect(response.headers.get("location")).toContain(`/${GlobalConstants.HOME}`);
        });

        it("should handle auth errors gracefully", async () => {
            // When decryptJWT encounters an error, it returns null
            vi.mocked(decryptJWT).mockResolvedValue(null);
            vi.mocked(isUserAuthorized).mockReturnValue(false);

            mockRequest = createMockRequest("/profile");
            const response = await middleware(mockRequest);

            expect(response.status).toBe(307); // Should redirect when no valid user
            expect(response.headers.get("location")).toContain(`/${GlobalConstants.HOME}`);
        });
    });

    describe("edge cases", () => {
        it("should handle paths with query parameters", async () => {
            const mockUser = {
                [GlobalConstants.ID]: "user123",
                [GlobalConstants.ROLE]: GlobalConstants.ADMIN,
                [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
            };
            vi.mocked(decryptJWT).mockResolvedValue(mockUser);
            vi.mocked(isUserAuthorized).mockReturnValue(true);

            mockRequest = createMockRequest("/members?page=2&sort=name");
            const response = await middleware(mockRequest);

            expect(isUserAuthorized).toHaveBeenCalledWith("/members", mockUser);
            expect(response.status).toBe(200);
        });

        it("should handle paths with fragments", async () => {
            const mockUser = null;
            vi.mocked(decryptJWT).mockResolvedValue(mockUser);
            vi.mocked(isUserAuthorized).mockReturnValue(false);

            mockRequest = createMockRequest("/profile#account-tab");
            const response = await middleware(mockRequest);

            expect(isUserAuthorized).toHaveBeenCalledWith("/profile", mockUser);
            expect(response.status).toBe(307);
        });

        it("should handle root path correctly", async () => {
            const mockUser = null;
            vi.mocked(decryptJWT).mockResolvedValue(mockUser);
            vi.mocked(isUserAuthorized).mockReturnValue(true);

            mockRequest = createMockRequest("/");
            const response = await middleware(mockRequest);

            expect(isUserAuthorized).toHaveBeenCalledWith("/", mockUser);
            expect(response.status).toBe(200);
        });
    });
});