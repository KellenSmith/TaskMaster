import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ParticipantDashboard from "./ParticipantDashboard";
import { useUserContext } from "../../context/UserContext";
import { addEventParticipant, deleteEventParticipant } from "../../lib/event-participant-actions";
import { addEventReserve, deleteEventReserve } from "../../lib/event-reserve-actions";
import { Language } from "../../../prisma/generated/enums";
import NotificationContextProvider from "../../context/NotificationContext";
import LocalizationContextProvider from "../../context/LocalizationContext";
import { selectAutocompleteOption } from "../../../test/test-helpers";

vi.mock("../../lib/event-participant-actions", () => ({
    addEventParticipant: vi.fn(),
    deleteEventParticipant: vi.fn(),
}));

vi.mock("../../lib/event-reserve-actions", () => ({
    addEventReserve: vi.fn(),
    deleteEventReserve: vi.fn(),
}));

type UserLike = {
    id: string;
    nickname: string;
    skill_badges?: any[];
};

type EventParticipantLike = {
    user: UserLike;
    event_id: string;
    ticket_id: string;
};

type EventReserveLike = {
    user: UserLike;
    event_id: string;
};

type TicketLike = {
    product_id: string;
    product: {
        name: string;
    };
};

type EventLike = {
    id: string;
    max_participants: number;
    host_id: string;
};

const baseUsers: UserLike[] = [
    { id: "user-1", nickname: "Alice", skill_badges: [] },
    { id: "user-2", nickname: "Bob", skill_badges: [] },
    { id: "user-3", nickname: "Charlie", skill_badges: [] },
    { id: "user-4", nickname: "Diana", skill_badges: [] },
];

const baseEvent: EventLike = {
    id: "event-1",
    max_participants: 3,
    host_id: "user-1",
};

const baseParticipants: EventParticipantLike[] = [
    { user: baseUsers[0], event_id: "event-1", ticket_id: "ticket-1" },
    { user: baseUsers[1], event_id: "event-1", ticket_id: "ticket-1" },
];

const baseReserves: EventReserveLike[] = [{ user: baseUsers[2], event_id: "event-1" }];

const baseTickets: TicketLike[] = [
    { product_id: "product-1", product: { name: "Standard Ticket" } },
    { product_id: "product-2", product: { name: "VIP Ticket" } },
];

const renderParticipantDashboard = async (
    eventOverrides: Partial<EventLike> = {},
    participants: EventParticipantLike[] = baseParticipants,
    reserves: EventReserveLike[] = baseReserves,
    tickets: TicketLike[] = baseTickets,
    activeMembers: UserLike[] = baseUsers,
) => {
    const event = {
        ...baseEvent,
        ...eventOverrides,
    };

    await act(async () => {
        render(
            <LocalizationContextProvider>
                <NotificationContextProvider>
                    <ParticipantDashboard
                        eventPromise={Promise.resolve(event as any)}
                        eventParticipantsPromise={Promise.resolve(participants as any)}
                        eventReservesPromise={Promise.resolve(reserves as any)}
                        eventTicketsPromise={Promise.resolve(tickets as any)}
                        activeMembersPromise={Promise.resolve(activeMembers as any)}
                    />
                </NotificationContextProvider>
            </LocalizationContextProvider>,
        );
    });

    return { event, participants, reserves, tickets, activeMembers };
};

const clickAddButtonInList = async (listHeader: RegExp) => {
    const list = screen.getByText(listHeader).closest("ul");
    const addIcon = within(list!).getByTestId("AddIcon");
    await userEvent.click(addIcon.closest("button")!);
};

describe("ParticipantDashboard", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.english,
        } as any);
        vi.mocked(addEventParticipant).mockResolvedValue(undefined as never);
        vi.mocked(deleteEventParticipant).mockResolvedValue(undefined as never);
        vi.mocked(addEventReserve).mockResolvedValue(undefined as never);
        vi.mocked(deleteEventReserve).mockResolvedValue(undefined as never);
    });

    it("renders participants list with count", async () => {
        await renderParticipantDashboard();

        expect(screen.getByText(/Participants \(2\)/i)).toBeInTheDocument();
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("renders reserves list with count when reserves exist", async () => {
        await renderParticipantDashboard();

        expect(screen.getByText(/Reserves \(1\)/i)).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("does not render reserves list when no reserves exist", async () => {
        await renderParticipantDashboard({}, baseParticipants, []);

        expect(screen.queryByText(/Reserves/i)).not.toBeInTheDocument();
        expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    });

    it("sorts participants alphabetically by nickname", async () => {
        const unsortedParticipants = [
            {
                user: { id: "user-5", nickname: "Zara" },
                event_id: "event-1",
                ticket_id: "ticket-1",
            },
            {
                user: { id: "user-6", nickname: "Adam" },
                event_id: "event-1",
                ticket_id: "ticket-1",
            },
            {
                user: { id: "user-7", nickname: "Mike" },
                event_id: "event-1",
                ticket_id: "ticket-1",
            },
        ];

        await renderParticipantDashboard({}, unsortedParticipants as any, []);

        const participantItems = screen
            .getAllByRole("listitem")
            .filter((item) => within(item).queryByTestId("PersonIcon"));
        const names = participantItems.map(
            (item) => within(item).getByText(/Adam|Mike|Zara/).textContent,
        );
        expect(names).toEqual(["Adam", "Mike", "Zara"]);
    });

    it("displays host chip for event host in participant list", async () => {
        await renderParticipantDashboard();

        // Alice (user-1) is host_id, so should have Host chip
        const aliceItem = screen.getByText("Alice").closest("li");
        expect(within(aliceItem!).getByText("Host")).toBeInTheDocument();

        // Bob is not a host
        const bobItem = screen.getByText("Bob").closest("li");
        expect(within(bobItem!).queryByText("Host")).not.toBeInTheDocument();
    });

    it("opens add participant dialog when add button clicked", async () => {
        await renderParticipantDashboard();

        await clickAddButtonInList(/Participants \(2\)/i);

        expect(screen.getByRole("combobox", { name: "Member" })).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Ticket" })).toBeInTheDocument();
    });

    it("opens add reserve dialog when add button clicked", async () => {
        await renderParticipantDashboard();

        await clickAddButtonInList(/Reserves \(1\)/i);

        expect(screen.getByRole("combobox", { name: "Member" })).toBeInTheDocument();
    });

    it("closes dialog when cancel button clicked", async () => {
        await renderParticipantDashboard();

        // Open dialog
        await clickAddButtonInList(/Participants \(2\)/i);

        expect(screen.getByRole("combobox", { name: "Member" })).toBeInTheDocument();

        // Close dialog
        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        await userEvent.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByRole("combobox", { name: "Member" })).not.toBeInTheDocument();
        });
    });

    it("calls deleteEventParticipant when delete button clicked", async () => {
        await renderParticipantDashboard();

        const bobItem = screen.getByText("Bob").closest("li");
        const deleteButton = within(bobItem!).getByRole("button");
        await userEvent.click(deleteButton);

        await waitFor(() => {
            expect(deleteEventParticipant).toHaveBeenCalledWith("event-1", "user-2");
        });
    });

    it("calls deleteEventReserve when delete button clicked on reserve", async () => {
        await renderParticipantDashboard();

        const charlieItem = screen.getByText("Charlie").closest("li");
        const deleteButton = within(charlieItem!).getByRole("button");
        await userEvent.click(deleteButton);

        await waitFor(() => {
            expect(deleteEventReserve).toHaveBeenCalledWith("user-3", "event-1");
        });
    });

    it("shows success notification after successful participant deletion", async () => {
        await renderParticipantDashboard();

        const bobItem = screen.getByText("Bob").closest("li");
        const deleteButton = within(bobItem!).getByRole("button");
        await userEvent.click(deleteButton);

        expect(await screen.findByText("Deleted")).toBeInTheDocument();
    });

    it("shows error notification after failed participant deletion", async () => {
        vi.mocked(deleteEventParticipant).mockRejectedValueOnce(new Error("Delete failed"));

        await renderParticipantDashboard();

        const bobItem = screen.getByText("Bob").closest("li");
        const deleteButton = within(bobItem!).getByRole("button");
        await userEvent.click(deleteButton);

        expect(await screen.findByText("Failed to delete")).toBeInTheDocument();
    });

    it("shows error notification after failed reserve deletion", async () => {
        vi.mocked(deleteEventReserve).mockRejectedValueOnce(new Error("Delete failed"));

        await renderParticipantDashboard();

        const charlieItem = screen.getByText("Charlie").closest("li");
        const deleteButton = within(charlieItem!).getByRole("button");
        await userEvent.click(deleteButton);

        expect(await screen.findByText("Failed to delete")).toBeInTheDocument();
    });

    it("prevents adding participant when already registered", async () => {
        await renderParticipantDashboard();

        // Open add participant dialog
        await clickAddButtonInList(/Participants \(2\)/i);

        await selectAutocompleteOption("Member", "Alice");
        await selectAutocompleteOption("Ticket", "Standard Ticket");
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(await screen.findByText("Member is already registered")).toBeInTheDocument();
    });

    it("prevents adding participant when event is sold out", async () => {
        // Event has max 3 participants, already has 3
        const threeParticipants = [
            ...baseParticipants,
            { user: baseUsers[3], event_id: "event-1", ticket_id: "ticket-1" },
        ];

        await renderParticipantDashboard({}, threeParticipants as any);

        // Open add participant dialog
        await clickAddButtonInList(/Participants \(3\)/i);

        await selectAutocompleteOption("Member", "Charlie");
        await selectAutocompleteOption("Ticket", "Standard Ticket");
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(await screen.findByText("This event is sold out")).toBeInTheDocument();
    });

    it("prevents adding reserve when already registered", async () => {
        await renderParticipantDashboard();

        // Open add reserve dialog
        await clickAddButtonInList(/Reserves \(1\)/i);

        await selectAutocompleteOption("Member", "Charlie");
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(await screen.findByText("Member is already registered")).toBeInTheDocument();
    });

    it("successfully adds participant and closes dialog", async () => {
        await renderParticipantDashboard();

        // Open add participant dialog
        await clickAddButtonInList(/Participants \(2\)/i);

        await selectAutocompleteOption("Member", "Diana");
        await selectAutocompleteOption("Ticket", "Standard Ticket");
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(addEventParticipant).toHaveBeenCalledWith("user-4", "product-1");
        });
    });

    it("successfully adds reserve and closes dialog", async () => {
        await renderParticipantDashboard();

        // Open add reserve dialog
        await clickAddButtonInList(/Reserves \(1\)/i);

        await selectAutocompleteOption("Member", "Diana");
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(addEventReserve).toHaveBeenCalledWith("user-4", "event-1");
        });
    });

    it("shows error when addEventParticipant fails", async () => {
        vi.mocked(addEventParticipant).mockRejectedValueOnce(new Error("Network error"));

        await renderParticipantDashboard();

        // Open add participant dialog
        await clickAddButtonInList(/Participants \(2\)/i);

        await selectAutocompleteOption("Member", "Diana");
        await selectAutocompleteOption("Ticket", "Standard Ticket");
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(await screen.findByText("Failed to save")).toBeInTheDocument();
    });

    it("shows error when addEventReserve fails", async () => {
        vi.mocked(addEventReserve).mockRejectedValueOnce(new Error("Network error"));

        await renderParticipantDashboard();

        // Open add reserve dialog
        await clickAddButtonInList(/Reserves \(1\)/i);

        await selectAutocompleteOption("Member", "Diana");
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(await screen.findByText("Failed to save")).toBeInTheDocument();
    });

    it("renders swedish labels when language is swedish", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);

        await renderParticipantDashboard();

        expect(screen.getByText(/Deltagare \(2\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Reserver \(1\)/i)).toBeInTheDocument();
        expect(screen.getByText("Värd")).toBeInTheDocument(); // Host chip in Swedish
    });

    it("provides user selection options from active members", async () => {
        await renderParticipantDashboard();

        // Open add participant dialog
        await clickAddButtonInList(/Participants \(2\)/i);

        const memberInput = screen.getByRole("combobox", { name: "Member" });
        await userEvent.click(memberInput);

        expect(await screen.findByRole("option", { name: "Alice" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Bob" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Charlie" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Diana" })).toBeInTheDocument();
    });

    it("provides ticket selection options from event tickets", async () => {
        await renderParticipantDashboard();

        // Open add participant dialog
        await clickAddButtonInList(/Participants \(2\)/i);

        const ticketInput = screen.getByRole("combobox", { name: "Ticket" });
        await userEvent.click(ticketInput);

        expect(await screen.findByRole("option", { name: "Standard Ticket" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "VIP Ticket" })).toBeInTheDocument();
    });
});
