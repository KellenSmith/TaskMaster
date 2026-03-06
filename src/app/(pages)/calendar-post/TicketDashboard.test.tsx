import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketDashboard from "./TicketDashboard";
import { useUserContext } from "../../context/UserContext";
import NotificationContextProvider from "../../context/NotificationContext";
import { deleteEventParticipant } from "../../lib/event-participant-actions";
import { useRouter } from "next/navigation";
import { Language } from "../../../prisma/generated/enums";

vi.mock("../../lib/event-participant-actions", () => ({
    deleteEventParticipant: vi.fn(),
}));

type EventParticipantLike = {
    user_id: string;
    event_id: string;
    ticket_id: string;
};

type EventTicketLike = {
    product_id: string;
    event_participants: EventParticipantLike[];
};

type EventLike = {
    id: string;
    tickets: EventTicketLike[];
};

type ProductLike = {
    id: string;
    name: string;
    price: number;
    description: string;
    stock: number | null;
    image_url: string | null;
};

type TicketLike = {
    product_id: string;
    product: ProductLike;
};

const baseProduct: ProductLike = {
    id: "product-1",
    name: "Standard Ticket",
    price: 12000,
    description: "General entry",
    stock: 10,
    image_url: null,
};

const baseEvent: EventLike = {
    id: "event-1",
    tickets: [
        {
            product_id: "product-1",
            event_participants: [{ user_id: "user-1", event_id: "event-1", ticket_id: "ticket-1" }],
        },
    ],
};

const baseTickets: TicketLike[] = [{ product_id: "product-1", product: baseProduct }];

const renderTicketDashboard = async (
    eventOverrides: Partial<EventLike> = {},
    tickets: TicketLike[] = baseTickets,
) => {
    const event = {
        ...baseEvent,
        ...eventOverrides,
    };

    await act(async () => {
        render(
            <NotificationContextProvider>
                <TicketDashboard
                    eventPromise={Promise.resolve(event as any)}
                    ticketsPromise={Promise.resolve(tickets as any)}
                />
            </NotificationContextProvider>,
        );
    });

    return { event, tickets };
};

describe("TicketDashboard", () => {
    const mockRefresh = vi.fn();

    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.english,
        } as any);
        vi.mocked(deleteEventParticipant).mockResolvedValue(undefined as never);
        vi.mocked(useRouter).mockReturnValue({
            push: vi.fn(),
            refresh: mockRefresh,
        } as any);
    });

    it("throws when user is not logged in", () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: null,
            language: Language.english,
        } as any);

        expect(() => {
            render(
                <NotificationContextProvider>
                    <TicketDashboard
                        eventPromise={Promise.resolve(baseEvent as any)}
                        ticketsPromise={Promise.resolve(baseTickets as any)}
                    />
                </NotificationContextProvider>,
            );
        }).toThrow("You must be logged in to view the ticket dashboard");
    });

    it("throws when no ticket is found for the user", async () => {
        const eventWithoutUserTicket: EventLike = {
            id: "event-1",
            tickets: [
                {
                    product_id: "product-1",
                    event_participants: [
                        { user_id: "other-user", event_id: "event-1", ticket_id: "ticket-1" },
                    ],
                },
            ],
        };

        await expect(renderTicketDashboard(eventWithoutUserTicket)).rejects.toThrow(
            "No ticket found for user",
        );
    });

    it("renders registered dashboard content for ticket holder", async () => {
        await renderTicketDashboard();

        expect(screen.getByText("Registered")).toBeInTheDocument();
        expect(screen.getByText("You're All Set!")).toBeInTheDocument();
        expect(
            screen.getByText("You have a ticket to this event. See you there!"),
        ).toBeInTheDocument();
        expect(screen.getByText("Can't make it after all?")).toBeInTheDocument();
        expect(
            screen.getByText("Leave the participant list to free up your spot for someone else."),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Leave Participant List" })).toBeInTheDocument();
    });

    it("renders product information through ProductCard", async () => {
        await renderTicketDashboard();

        expect(screen.getAllByText("Standard Ticket").length).toBeGreaterThan(0);
        expect(screen.getByText("120 SEK")).toBeInTheDocument();
    });

    it("opens confirmation dialog with leave warning text", async () => {
        await renderTicketDashboard();

        await userEvent.click(screen.getByRole("button", { name: "Leave Participant List" }));

        expect(screen.getByText("Confirm")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Are you sure you want to leave this event? This action cannot be undone and you will lose your spot.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Proceed" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("closes dialog when cancel is clicked and does not leave event", async () => {
        await renderTicketDashboard();

        await userEvent.click(screen.getByRole("button", { name: "Leave Participant List" }));
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

        await waitFor(() => {
            expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
        });
        expect(deleteEventParticipant).not.toHaveBeenCalled();
        expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("leaves participant list on proceed and shows success notification", async () => {
        await renderTicketDashboard();

        await userEvent.click(screen.getByRole("button", { name: "Leave Participant List" }));
        await userEvent.click(screen.getByRole("button", { name: "Proceed" }));

        await waitFor(() => {
            expect(deleteEventParticipant).toHaveBeenCalledWith("event-1", "user-1");
        });
        expect(await screen.findByText("You have left the event")).toBeInTheDocument();
        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("shows error notification when leaving participant list fails", async () => {
        vi.mocked(deleteEventParticipant).mockRejectedValueOnce(new Error("leave failed") as never);
        await renderTicketDashboard();

        await userEvent.click(screen.getByRole("button", { name: "Leave Participant List" }));
        await userEvent.click(screen.getByRole("button", { name: "Proceed" }));

        expect(await screen.findByText("Failed to leave the event")).toBeInTheDocument();
        expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("renders swedish labels and button text", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);

        await renderTicketDashboard();

        expect(screen.getByText("Registrerad")).toBeInTheDocument();
        expect(screen.getByText("Allt klart!")).toBeInTheDocument();
        expect(
            screen.getByText("Du har en biljett till detta evenemang. Syns där!"),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Lämna Deltagarlistan" })).toBeInTheDocument();
    });
});
