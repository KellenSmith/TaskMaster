import { describe, it, expect, vi } from "vitest";
import TicketPage from "./page";
import { prisma } from "../../../prisma/prisma-client";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

vi.mock("../../ui/ErrorBoundarySuspense", () => ({
    default: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));
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
        // Should render ErrorBoundarySuspense
        expect(result.type).toBe(ErrorBoundarySuspense);
        // Should render TicketDashboard inside ErrorBoundarySuspense
        const ticketDashboardElement = result.props.children.type();
        expect(ticketDashboardElement.props["data-testid"]).toBe("ticket-dashboard");
        // passes the ticketInfoPromise to Dashboard
        const ticketDashboard = result.props.children;
        expect(ticketDashboard.props.eventParticipantPromise).toStrictEqual(
            Promise.resolve(mockEventParticipant),
        );
    });

    it("renders dashboard even if eventParticipant is not found", async () => {
        vi.mocked(prisma.eventParticipant.findUnique).mockResolvedValue(null);
        const searchParams = Promise.resolve({ eventParticipantId: "ep-404" });

        const result = await TicketPage({ searchParams });

        const ticketDashboardElement = result.props.children.type();
        expect(ticketDashboardElement.props["data-testid"]).toBe("ticket-dashboard");
        // passes the ticketInfoPromise to Dashboard
        const ticketDashboard = result.props.children;
        expect(ticketDashboard.props.eventParticipantPromise).toStrictEqual(Promise.resolve(null));
    });
});
