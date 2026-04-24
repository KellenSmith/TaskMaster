import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "./page";
import { getLoggedInUser } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import * as utils from "../../lib/utils";

vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

beforeEach(() => {
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

        // passes the ticketInfoPromise to Dashboard
        expect(result.props.ticketInfoPromise).toStrictEqual(Promise.resolve(mockTicketInfo));
    });
});
