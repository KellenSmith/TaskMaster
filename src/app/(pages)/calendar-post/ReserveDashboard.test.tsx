import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReserveDashboard from "./ReserveDashboard";
import { useUserContext } from "../../context/UserContext";
import NotificationContextProvider from "../../context/NotificationContext";
import { addEventReserve, deleteEventReserve } from "../../lib/event-reserve-actions";
import { Language } from "../../../prisma/generated/enums";

vi.mock("../../lib/event-reserve-actions", () => ({
    addEventReserve: vi.fn(),
    deleteEventReserve: vi.fn(),
}));

type ReserveLike = {
    user_id: string;
    event_id: string;
};

type EventLike = {
    id: string;
    event_reserves: ReserveLike[];
};

const baseEvent: EventLike = {
    id: "event-1",
    event_reserves: [],
};

const renderReserveDashboard = async (eventOverrides: Partial<EventLike> = {}) => {
    const event = {
        ...baseEvent,
        ...eventOverrides,
    };

    await act(async () => {
        render(
            <NotificationContextProvider>
                <ReserveDashboard eventPromise={Promise.resolve(event as any)} />
            </NotificationContextProvider>,
        );
    });

    return { event };
};

describe("ReserveDashboard", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.english,
        } as any);
        vi.mocked(addEventReserve).mockResolvedValue(undefined as never);
        vi.mocked(deleteEventReserve).mockResolvedValue(undefined as never);
    });

    it("throws when user is not logged in", () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: null,
            language: Language.english,
        } as any);

        expect(() => {
            render(
                <NotificationContextProvider>
                    <ReserveDashboard eventPromise={Promise.resolve(baseEvent as any)} />
                </NotificationContextProvider>,
            );
        }).toThrow("You must be logged in to view the reserve dashboard");
    });

    it("renders sold-out state when user is not on reserve list", async () => {
        await renderReserveDashboard({ event_reserves: [] });

        expect(screen.getByText("Sorry, this event is sold out")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Join the reserve list to be notified if a spot opens up for this event.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Join Reserve List" })).toBeInTheDocument();
        expect(screen.queryByText("Registered")).not.toBeInTheDocument();
        expect(
            screen.queryByText("You'll be notified if a spot opens up."),
        ).not.toBeInTheDocument();
    });

    it("renders reserve state when user is on reserve list", async () => {
        await renderReserveDashboard({
            event_reserves: [{ user_id: "user-1", event_id: "event-1" }],
        });

        expect(screen.getByText("You're on the Reserve List!")).toBeInTheDocument();
        expect(screen.getByText("Registered")).toBeInTheDocument();
        expect(screen.getByText("You'll be notified if a spot opens up.")).toBeInTheDocument();
        expect(
            screen.getByText("Leave the reserve list to stop receiving notifications."),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Leave Reserve List" })).toBeInTheDocument();
    });

    it("opens join confirmation dialog with join text", async () => {
        await renderReserveDashboard({ event_reserves: [] });

        await userEvent.click(screen.getByRole("button", { name: "Join Reserve List" }));

        expect(screen.getByText("Confirm")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Are you sure you want to join the reserve list? You'll be notified if a spot opens up.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Proceed" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("opens leave confirmation dialog with leave text", async () => {
        await renderReserveDashboard({
            event_reserves: [{ user_id: "user-1", event_id: "event-1" }],
        });

        await userEvent.click(screen.getByRole("button", { name: "Leave Reserve List" }));

        expect(screen.getByText("Confirm")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Are you sure you want to leave the reserve list? You will not be notified if a spot opens up.",
            ),
        ).toBeInTheDocument();
    });

    it("closes confirm dialog when clicking cancel", async () => {
        await renderReserveDashboard({ event_reserves: [] });

        await userEvent.click(screen.getByRole("button", { name: "Join Reserve List" }));
        expect(screen.getByText("Confirm")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

        await waitFor(() => {
            expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
        });
        expect(addEventReserve).not.toHaveBeenCalled();
    });

    it("joins reserve list and shows success notification on proceed", async () => {
        await renderReserveDashboard({ event_reserves: [] });

        await userEvent.click(screen.getByRole("button", { name: "Join Reserve List" }));
        await userEvent.click(screen.getByRole("button", { name: "Proceed" }));

        await waitFor(() => {
            expect(addEventReserve).toHaveBeenCalledWith("user-1", "event-1");
        });
        expect(await screen.findByText("You have joined the reserve list.")).toBeInTheDocument();
    });

    it("shows error notification when joining reserve list fails", async () => {
        vi.mocked(addEventReserve).mockRejectedValueOnce(new Error("join failed") as never);
        await renderReserveDashboard({ event_reserves: [] });

        await userEvent.click(screen.getByRole("button", { name: "Join Reserve List" }));
        await userEvent.click(screen.getByRole("button", { name: "Proceed" }));

        expect(
            await screen.findByText("Failed to add you to the reserve list."),
        ).toBeInTheDocument();
    });

    it("leaves reserve list and shows success notification on proceed", async () => {
        await renderReserveDashboard({
            event_reserves: [{ user_id: "user-1", event_id: "event-1" }],
        });

        await userEvent.click(screen.getByRole("button", { name: "Leave Reserve List" }));
        await userEvent.click(screen.getByRole("button", { name: "Proceed" }));

        await waitFor(() => {
            expect(deleteEventReserve).toHaveBeenCalledWith("user-1", "event-1");
        });
        expect(await screen.findByText("You have left the reserve list.")).toBeInTheDocument();
    });

    it("shows error notification when leaving reserve list fails", async () => {
        vi.mocked(deleteEventReserve).mockRejectedValueOnce(new Error("leave failed") as never);
        await renderReserveDashboard({
            event_reserves: [{ user_id: "user-1", event_id: "event-1" }],
        });

        await userEvent.click(screen.getByRole("button", { name: "Leave Reserve List" }));
        await userEvent.click(screen.getByRole("button", { name: "Proceed" }));

        expect(await screen.findByText("Failed to leave the reserve list.")).toBeInTheDocument();
    });

    it("renders swedish reserve state texts", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);
        await renderReserveDashboard({
            event_reserves: [{ user_id: "user-1", event_id: "event-1" }],
        });

        expect(screen.getByText("Du är på reservlistan!")).toBeInTheDocument();
        expect(screen.getByText("Registrerad")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Lämna Reservlistan" })).toBeInTheDocument();
    });

    it("renders swedish join state texts", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);
        await renderReserveDashboard({ event_reserves: [] });

        expect(screen.getByText("Tyvärr, detta evenemang är slutsålt.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Gå med i Reservlistan" })).toBeInTheDocument();
    });
});
