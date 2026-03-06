import { screen, act, render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import Dashboard from "./Dashboard";
import { useUserContext } from "../../context/UserContext";
import { Language } from "../../../prisma/generated/enums";

const mockUser = { nickname: "TestUser", id: 1 };

// Example props for Dashboard
const ticketInfoPromise = Promise.resolve([
    {
        id: "ep-1",
        ticket: {
            event: {
                title: "Sample Event",
                start_time: new Date("2026-02-22T10:00:00Z"),
                end_time: new Date("2026-02-22T12:00:00Z"),
                location: { name: "Main Hall" },
            },
            user: { id: 1, nickname: "TestUser" },
        },
    },
]) as any;

describe("Dashboard", () => {
    it("renders welcome and ticket cards for user with tickets", async () => {
        vi.mocked(useUserContext).mockReturnValue({ user: mockUser, language: "english" } as any);

        await act(async () => render(<Dashboard ticketInfoPromise={ticketInfoPromise} />));
        // Welcome message
        expect(screen.getByText(/Welcome back, TestUser!/i)).toBeInTheDocument();
        // Tickets section title
        expect(screen.getByText(/Tickets for upcoming events/i)).toBeInTheDocument();
        // Ticket card title
        expect(screen.getByText(/Sample Event/i)).toBeInTheDocument();
        // Ticket card location
        expect(screen.getByText(/Main Hall/i)).toBeInTheDocument();
        // Event start and end time
        expect(screen.getByText("2026/02/22 10:00 - 2026/02/22 12:00")).toBeInTheDocument();
        // QR image alt
        expect(screen.getByAltText(/QR code for ticket ep-1/i)).toBeInTheDocument();
    });

    it("renders empty state link when no tickets", async () => {
        vi.mocked(useUserContext).mockReturnValue({ user: mockUser, language: "english" } as any);

        await act(async () => render(<Dashboard ticketInfoPromise={Promise.resolve([])} />));
        // Empty state message
        expect(
            screen.getByText(/You have no tickets. Check the calendar for upcoming events./i),
        ).toBeInTheDocument();
        // Link to calendar
        const calendarLink = screen.getByRole("link", { name: /You have no tickets/i });
        expect(calendarLink.getAttribute("href")).toBe("/calendar");
    });

    it("renders swedish translations", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: mockUser,
            language: Language.swedish,
        } as any);

        await act(async () => render(<Dashboard ticketInfoPromise={ticketInfoPromise} />));

        expect(screen.getByText(/Välkommen tillbaka, TestUser!/i)).toBeInTheDocument();
        expect(screen.getByText(/Biljetter för kommande evenemang/i)).toBeInTheDocument();
        expect(screen.getByAltText(/QR-kod för biljett ep-1/i)).toBeInTheDocument();
    });
});
