import { describe, it, expect, vi } from "vitest";
import TicketPage from "./page";
import { prisma } from "../../../prisma/prisma-client";

// Mock child component to not have to call contexts and other dependencies
vi.mock("./TicketDashboard", () => ({
    default: () => <div data-testid="ticket-dashboard" />,
}));

const mockEventParticipant = {
    id: "ep-1",
    ticket: { event: { title: "Event 1" } },
    user: { id: "user-1", nickname: "TestUser" },
};

describe("TicketPage", () => {
    it("fetches event participant by id and renders dashboard", async () => {
        vi.mocked(prisma.eventParticipant.findUnique).mockResolvedValue(
            mockEventParticipant as any,
        );
        const searchParams = Promise.resolve({ eventParticipantId: "ep-1" });

        const result = await TicketPage({ searchParams });

        // Should call prisma with correct parameters
        expect(prisma.eventParticipant.findUnique).toHaveBeenCalledWith({
            where: { id: "ep-1" },
            include: {
                ticket: { include: { event: true } },
                user: { select: { id: true, nickname: true } },
            },
        });
        // passes the ticketInfoPromise to Dashboard
        expect(result.props.eventParticipantPromise).toStrictEqual(
            Promise.resolve(mockEventParticipant),
        );
    });

    it("renders dashboard even if eventParticipant is not found", async () => {
        vi.mocked(prisma.eventParticipant.findUnique).mockResolvedValue(null);
        const searchParams = Promise.resolve({ eventParticipantId: "ep-404" });

        const result = await TicketPage({ searchParams });

        // passes the ticketInfoPromise to Dashboard
        expect(result.props.eventParticipantPromise).toStrictEqual(Promise.resolve(null));
    });
});
