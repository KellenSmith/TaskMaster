import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import {
    isUserAuthorized,
    routes,
    routesToPath,
    isMembershipExpired,
    isUserAdmin,
    membershipExpiresAt,
} from "./definitions";
import { JWTPayload } from "jose";
import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";

// Mock environment variables
beforeAll(() => {
    vi.stubEnv("NEXT_PUBLIC_MEMBERSHIP_DURATION", "365");
});

describe("Route Security", () => {
    describe("routesToPath", () => {
        it("should convert route list to paths with leading slash", () => {
            const routeList = ["home", "profile", "admin"];
            const expected = ["/home", "/profile", "/admin"];
            expect(routesToPath(routeList)).toEqual(expected);
        });

        it("should handle empty array", () => {
            expect(routesToPath([])).toEqual([]);
        });
    });

    describe("isUserAuthorized", () => {
        const publicRoutes = routesToPath(routes[GlobalConstants.PUBLIC]);
        const privateRoutes = routesToPath(routes[GlobalConstants.PRIVATE]);
        const adminRoutes = routesToPath(routes[GlobalConstants.ADMIN]);

        describe("non-logged in users (null user)", () => {
            it("should allow access to public routes", () => {
                publicRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, null)).toBe(true);
                });
            });

            it("should deny access to private routes", () => {
                privateRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, null)).toBe(false);
                });
            });

            it("should deny access to admin routes", () => {
                adminRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, null)).toBe(false);
                });
            });
        });

        describe("users with expired membership", () => {
            const expiredUser: JWTPayload = {
                [GlobalConstants.ID]: "user123",
                [GlobalConstants.EMAIL]: "test@example.com",
                [GlobalConstants.ROLE]: "member",
                [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(2, "year").toISOString(),
            };

            it("should allow access to public routes", () => {
                publicRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, expiredUser)).toBe(true);
                });
            });

            it("should allow access to profile page", () => {
                expect(isUserAuthorized(`/${GlobalConstants.PROFILE}`, expiredUser)).toBe(true);
            });

            it("should deny access to other private routes", () => {
                const otherPrivateRoutes = privateRoutes.filter(
                    (route) => route !== `/${GlobalConstants.PROFILE}`,
                );
                otherPrivateRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, expiredUser)).toBe(false);
                });
            });

            it("should deny access to admin routes", () => {
                adminRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, expiredUser)).toBe(false);
                });
            });
        });

        describe("active regular members", () => {
            const activeUser: JWTPayload = {
                [GlobalConstants.ID]: "user123",
                [GlobalConstants.EMAIL]: "test@example.com",
                [GlobalConstants.ROLE]: "member",
                [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
            };

            it("should allow access to public routes", () => {
                publicRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, activeUser)).toBe(true);
                });
            });

            it("should allow access to private routes", () => {
                privateRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, activeUser)).toBe(true);
                });
            });

            it("should deny access to admin routes", () => {
                adminRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, activeUser)).toBe(false);
                });
            });
        });

        describe("admin users", () => {
            const adminUser: JWTPayload = {
                [GlobalConstants.ID]: "admin123",
                [GlobalConstants.EMAIL]: "admin@example.com",
                [GlobalConstants.ROLE]: GlobalConstants.ADMIN,
                [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
            };

            it("should allow access to all routes", () => {
                const allRoutes = [...publicRoutes, ...privateRoutes, ...adminRoutes];
                allRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, adminUser)).toBe(true);
                });
            });

            it("should restrict admin access when membership is expired", () => {
                const expiredAdminUser = {
                    ...adminUser,
                    [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(2, "year").toISOString(),
                };
                
                // Admin with expired membership should only have access to public routes + profile
                publicRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, expiredAdminUser)).toBe(true);
                });
                expect(isUserAuthorized(`/${GlobalConstants.PROFILE}`, expiredAdminUser)).toBe(true);
                
                // Should not have access to admin routes when membership is expired
                adminRoutes.forEach((route) => {
                    expect(isUserAuthorized(route, expiredAdminUser)).toBe(false);
                });
            });
        });

        describe("edge cases", () => {
            it("should handle paths with query parameters", () => {
                const activeUser: JWTPayload = {
                    [GlobalConstants.ID]: "user123",
                    [GlobalConstants.ROLE]: "member",
                    [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
                };

                expect(isUserAuthorized("/calendar?event=123", activeUser)).toBe(true);
                expect(isUserAuthorized("/members?page=2", activeUser)).toBe(false);
            });

            it("should handle nested admin paths", () => {
                const adminUser: JWTPayload = {
                    [GlobalConstants.ROLE]: GlobalConstants.ADMIN,
                    [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
                };

                const regularUser: JWTPayload = {
                    [GlobalConstants.ROLE]: "member",
                    [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
                };

                expect(isUserAuthorized("/members/create", adminUser)).toBe(true);
                expect(isUserAuthorized("/members/create", regularUser)).toBe(false);
                expect(isUserAuthorized("/sendout/history", adminUser)).toBe(true);
                expect(isUserAuthorized("/sendout/history", regularUser)).toBe(false);
            });

            it("should handle unknown routes (default to private)", () => {
                const activeUser: JWTPayload = {
                    [GlobalConstants.ROLE]: "member",
                    [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
                };

                // Unknown routes should be accessible to active users but not to non-logged in users
                expect(isUserAuthorized("/unknown-route", activeUser)).toBe(true);
                expect(isUserAuthorized("/unknown-route", null)).toBe(false);
            });
        });
    });

    describe("membership functions", () => {
        beforeEach(() => {
            // Mock environment variable
            vi.stubEnv("NEXT_PUBLIC_MEMBERSHIP_DURATION", "365");
        });

        describe("membershipExpiresAt", () => {
            it("should calculate correct expiry date", () => {
                const user = {
                    [GlobalConstants.MEMBERSHIP_RENEWED]: "2023-01-01T00:00:00.000Z",
                };

                const expiryDate = membershipExpiresAt(user);
                const expected = dayjs("2023-01-01T00:00:00.000Z")
                    .add(366, "d") // 365 + 1 grace day
                    .toISOString();

                expect(expiryDate).toBe(expected);
            });
        });

        describe("isMembershipExpired", () => {
            it("should return true for users without membership renewal date", () => {
                expect(isMembershipExpired(null)).toBe(true);
                expect(isMembershipExpired({})).toBe(true);
                expect(isMembershipExpired({ [GlobalConstants.ID]: "123" })).toBe(true);
            });

            it("should return true for expired memberships", () => {
                const expiredUser = {
                    [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(2, "year").toISOString(),
                };
                expect(isMembershipExpired(expiredUser)).toBe(true);
            });

            it("should return false for active memberships", () => {
                const activeUser = {
                    [GlobalConstants.MEMBERSHIP_RENEWED]: dayjs().subtract(1, "day").toISOString(),
                };
                expect(isMembershipExpired(activeUser)).toBe(false);
            });
        });

        describe("isUserAdmin", () => {
            it("should return true for admin users", () => {
                const adminUser = { [GlobalConstants.ROLE]: GlobalConstants.ADMIN };
                expect(isUserAdmin(adminUser)).toBe(true);
            });

            it("should return false for non-admin users", () => {
                expect(isUserAdmin(null)).toBe(false);
                expect(isUserAdmin({})).toBe(false);
                expect(isUserAdmin({ [GlobalConstants.ROLE]: "member" })).toBe(false);
                expect(isUserAdmin({ [GlobalConstants.ROLE]: "user" })).toBe(false);
            });
        });
    });

    describe("route definitions validation", () => {
        it("should have valid route structure", () => {
            expect(routes).toHaveProperty(GlobalConstants.PUBLIC);
            expect(routes).toHaveProperty(GlobalConstants.PRIVATE);
            expect(routes).toHaveProperty(GlobalConstants.ADMIN);

            expect(Array.isArray(routes[GlobalConstants.PUBLIC])).toBe(true);
            expect(Array.isArray(routes[GlobalConstants.PRIVATE])).toBe(true);
            expect(Array.isArray(routes[GlobalConstants.ADMIN])).toBe(true);
        });

        it("should not have duplicate routes across categories", () => {
            const allRoutes = [
                ...routes[GlobalConstants.PUBLIC],
                ...routes[GlobalConstants.PRIVATE],
                ...routes[GlobalConstants.ADMIN],
            ];
            const uniqueRoutes = new Set(allRoutes);
            expect(allRoutes.length).toBe(uniqueRoutes.size);
        });

        it("should include essential routes", () => {
            const publicRoutes = routes[GlobalConstants.PUBLIC];
            expect(publicRoutes).toContain(GlobalConstants.HOME);
            expect(publicRoutes).toContain(GlobalConstants.LOGIN);
            expect(publicRoutes).toContain(GlobalConstants.APPLY);

            const privateRoutes = routes[GlobalConstants.PRIVATE];
            expect(privateRoutes).toContain(GlobalConstants.PROFILE);

            const adminRoutes = routes[GlobalConstants.ADMIN];
            expect(adminRoutes).toContain(GlobalConstants.MEMBERS);
        });
    });
});