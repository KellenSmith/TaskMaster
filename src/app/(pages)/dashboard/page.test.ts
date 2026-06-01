import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "./page";
import { getLoggedInUser } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";
import dayjs from "dayjs";

vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

const mockedNow = dayjs.utc();
beforeEach(() => {
    vi.spyOn(dayjs, "utc").mockReturnValue(mockedNow);
    vi.mocked(getLoggedInUser).mockReset();
    vi.mocked(prisma.eventParticipant.findMany).mockReset();
});

describe("DashboardPage", () => {
    it("returns dashboard and rejects ticket promise if user is not logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);

        const result = await DashboardPage();

        await expect(result.props.ticketInfoPromise).rejects.toThrow("Unauthorized");
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
