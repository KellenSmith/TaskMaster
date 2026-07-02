import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReactElement, ReactNode } from "react";
import ProtectedPage from "./ProtectedPage";
import GlobalConstants from "./GlobalConstants";
import { UserRole, UserStatus } from "../prisma/generated/enums";
import { getLoggedInUser } from "./lib/user-helpers";
import { isMembershipExpired, serverRedirect } from "./lib/utils";

vi.mock("./lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

vi.mock("./lib/utils", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./lib/utils")>();

    return {
        ...actual,
        isMembershipExpired: vi.fn(),
        serverRedirect: vi.fn(),
    };
});

const createUser = (overrides: Record<string, unknown> = {}) => ({
    id: "user-1",
    role: UserRole.member,
    status: UserStatus.validated,
    user_membership: {
        expires_at: "2099-01-01T00:00:00.000Z",
    },
    ...overrides,
});

const getRenderedChildren = async (name: string, children: ReactNode) => {
    const result = (await ProtectedPage({
        name,
        children,
    })) as ReactElement<{ children: ReactNode }>;

    return result.props.children;
};

describe("ProtectedPage", () => {
    beforeEach(() => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
        vi.mocked(isMembershipExpired).mockReturnValue(false);
        vi.mocked(serverRedirect).mockImplementation(() => {
            throw new Error("Redirect called");
        });
    });

    it("throws when the route is missing from routeTreeConfig", async () => {
        await expect(
            ProtectedPage({
                name: "missing-route",
                children: <div>Hidden content</div>,
            }),
        ).rejects.toThrow("Route configuration for missing-route not found in routeTreeConfig");
    });

    it("renders children for routes without auth requirements", async () => {
        const renderedChildren = await getRenderedChildren(
            GlobalConstants.HOME,
            <div>Public content</div>,
        );

        expect(renderedChildren).toEqual(<div>Public content</div>);
        expect(getLoggedInUser).not.toHaveBeenCalled();
        expect(serverRedirect).not.toHaveBeenCalled();
    });

    it("redirects unauthenticated users to login for protected routes", async () => {
        await expect(
            ProtectedPage({
                name: GlobalConstants.DASHBOARD,
                children: <div>Protected content</div>,
            }),
        ).rejects.toThrow("Redirect called");

        expect(getLoggedInUser).toHaveBeenCalledOnce();
        expect(serverRedirect).toHaveBeenCalledWith([GlobalConstants.LOGIN]);
    });

    it("redirects users with insufficient status to profile", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(
            createUser({ status: UserStatus.pending }) as any,
        );

        await expect(
            ProtectedPage({
                name: GlobalConstants.DASHBOARD,
                children: <div>Protected content</div>,
            }),
        ).rejects.toThrow("Redirect called");

        expect(serverRedirect).toHaveBeenCalledWith([GlobalConstants.PROFILE]);
        expect(isMembershipExpired).not.toHaveBeenCalled();
    });

    it("redirects validated members with expired membership when the route requires membership", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(createUser() as any);
        vi.mocked(isMembershipExpired).mockReturnValue(true);

        await expect(
            ProtectedPage({
                name: GlobalConstants.DASHBOARD,
                children: <div>Members only</div>,
            }),
        ).rejects.toThrow("Redirect called");

        expect(serverRedirect).toHaveBeenCalledWith([GlobalConstants.PROFILE]);
    });

    it("redirects users without the required role to profile", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(createUser() as any);

        await expect(
            ProtectedPage({
                name: GlobalConstants.LOCATIONS,
                children: <div>Admin content</div>,
            }),
        ).rejects.toThrow("Redirect called");

        expect(serverRedirect).toHaveBeenCalledWith([GlobalConstants.PROFILE]);
    });

    it("does not enforce membership expiry on routes where membershipRequired is false", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(createUser() as any);
        vi.mocked(isMembershipExpired).mockReturnValue(true);

        const renderedChildren = await getRenderedChildren(
            GlobalConstants.ORDER,
            <div>Order content</div>,
        );

        expect(renderedChildren).toEqual(<div>Order content</div>);
        expect(serverRedirect).not.toHaveBeenCalled();
    });

    it("renders children for authenticated users who satisfy all requirements", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(createUser({ role: UserRole.admin }) as any);

        const renderedChildren = await getRenderedChildren(
            GlobalConstants.LOCATIONS,
            <div>Admin content</div>,
        );

        expect(renderedChildren).toEqual(<div>Admin content</div>);
        expect(serverRedirect).not.toHaveBeenCalled();
        expect(isMembershipExpired).toHaveBeenCalled();
    });
});
