import { screen, act } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import Dashboard from "./Dashboard";
import { customRender } from "../../../test/test-utils";

// Mocks
vi.mock("../../lib/utils", () => ({
    clientRedirect: vi.fn(),
    getRelativeUrl: vi.fn(() => "/calendar"),
    getAbsoluteUrl: vi.fn(() => "https://testurl.com/api/ticket-qrcode/1"),
}));
vi.mock("../../ui/TextContent", () => ({
    __esModule: true,
    default: ({ id }: any) => <div data-testid="text-content">{id}</div>,
}));

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
        await act(async () =>
            customRender(<Dashboard ticketInfoPromise={ticketInfoPromise} />, {
                user: mockUser,
                language: "english",
            } as any),
        );
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
        await act(async () =>
            customRender(<Dashboard ticketInfoPromise={Promise.resolve([])} />, {
                user: mockUser,
                language: "english",
            } as any),
        );
        // Empty state message
        expect(
            screen.getByText(/You have no tickets. Check the calendar for upcoming events./i),
        ).toBeInTheDocument();
        // Link to calendar
        expect(screen.getByRole("link", { name: /You have no tickets/i })).toBeInTheDocument();
    });

    it("renders swedish translations", async () => {
        await act(async () =>
            customRender(<Dashboard ticketInfoPromise={ticketInfoPromise} />, {
                user: mockUser,
                language: "swedish",
            } as any),
        );
        expect(screen.getByText(/Välkommen tillbaka, TestUser!/i)).toBeInTheDocument();
        expect(screen.getByText(/Biljetter för kommande evenemang/i)).toBeInTheDocument();
        expect(screen.getByAltText(/QR-kod för biljett ep-1/i)).toBeInTheDocument();
    });
});
