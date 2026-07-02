import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "./page";
import { getLoggedInUser } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";
import dayjs from "dayjs";
import testdata from "../../../test/testdata";
import { serverRedirect } from "../../lib/utils";
import GlobalConstants from "../../GlobalConstants";

vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));
vi.mock("../../lib/utils", () => ({
    serverRedirect: vi.fn(() => {
        throw new Error("Redirect called");
    }),
}));

const mockedNow = dayjs.utc();
beforeEach(() => {
    vi.spyOn(dayjs, "utc").mockReturnValue(mockedNow);
});

describe("DashboardPage", () => {
    it("returns dashboard wrapped in ProtectedPage and rejects the ticket promise if user is not logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);

        const page = await DashboardPage();

        expect(vi.mocked(getLoggedInUser)).toHaveBeenCalledTimes(1);
        expect(page.props.name).toBe(GlobalConstants.DASHBOARD);
        await expect(page.props.children.props.ticketInfoPromise).rejects.toThrow(TypeError);
        expect(vi.mocked(serverRedirect)).not.toHaveBeenCalled();
        expect(vi.mocked(prisma.eventParticipant.findMany)).not.toHaveBeenCalled();
    });

    it("renders dashboard for logged-in user", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(testdata.user);
        const mockTicketInfo = [{ id: "ep-1", ticket: { event: { title: "Event 1" } } }];
        vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue(mockTicketInfo as any);

        await DashboardPage();

        // passes the ticketInfoPromise to Dashboard
        expect(vi.mocked(prisma.eventParticipant.findMany)).toHaveBeenCalledTimes(1);
    });
});
