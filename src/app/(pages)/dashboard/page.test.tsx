import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "./page";
import { getLoggedInUser } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import dayjs from "dayjs";
import * as utils from "../../lib/utils";

vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

vi.mock("./Dashboard", () => ({
    default: () => <div data-testid="dashboard">Dashboard</div>,
}));

vi.mock("../../ui/ErrorBoundarySuspense", () => ({
    default: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

const mockedNow = dayjs.utc();
beforeEach(() => {
    vi.spyOn(dayjs, "utc").mockReturnValue(mockedNow);
    vi.mocked(getLoggedInUser).mockReset();
    vi.mocked(prisma.eventParticipant.findMany).mockReset();
});
const serverRedirectSpy = vi.spyOn(utils, "serverRedirect");

describe("DashboardPage", () => {
    it("redirects if user is not logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);

        await expect(DashboardPage()).rejects.toThrow("Redirect called");

        expect(serverRedirectSpy).toHaveBeenCalledWith([GlobalConstants.LOGIN]);
    });

    it("renders dashboard for logged-in user", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: "user-1", nickname: "TestUser" } as any);
        const mockTicketInfo = [{ id: "ep-1", ticket: { event: { title: "Event 1" } } }];
        vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue(mockTicketInfo as any);
        const result = await DashboardPage();

        // result is the ErrorBoundarySuspense mock, its children is the Dashboard mock
        expect(result.type).toBe(ErrorBoundarySuspense);
        // Handle functional mock for Dashboard
        const dashboardElement = result.props.children.type();
        expect(dashboardElement.props["data-testid"]).toBe("dashboard");
        // passes the ticketInfoPromise to Dashboard
        const dashboard = result.props.children;
        expect(dashboard.props.ticketInfoPromise).toStrictEqual(Promise.resolve(mockTicketInfo));
    });
});
