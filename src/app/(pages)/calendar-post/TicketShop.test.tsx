import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketShop from "./TicketShop";
import { useUserContext } from "../../context/UserContext";
import NotificationContextProvider from "../../context/NotificationContext";
import { createAndRedirectToOrder } from "../../lib/order-actions";
import { createEventTicket, deleteEventTicket, updateEventTicket } from "../../lib/ticket-actions";
import { isUserAdmin, isUserHost } from "../../lib/utils";
import { Language, TicketType } from "../../../prisma/generated/enums";
import { selectAutocompleteOption } from "../../../test/test-helpers";

vi.mock("../../lib/order-actions", () => ({
    createAndRedirectToOrder: vi.fn(),
}));

vi.mock("../../lib/ticket-actions", () => ({
    createEventTicket: vi.fn(),
    deleteEventTicket: vi.fn(),
    updateEventTicket: vi.fn(),
}));

vi.mock("../../lib/utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        isUserAdmin: vi.fn(() => false),
        isUserHost: vi.fn(() => false),
    };
});

type ProductLike = {
    id: string;
    name: string;
    price: number;
    vat_percentage: number;
    description: string;
    stock: number | null;
    image_url: string | null;
};

type TicketLike = {
    product_id: string;
    type: TicketType;
    product: ProductLike;
};

type EventLike = {
    id: string;
};

type TaskLike = {
    id: string;
    assignee_id: string | null;
};

const baseEvent: EventLike = { id: "event-1" };

const standardLow: TicketLike = {
    product_id: "prod-standard-low",
    type: TicketType.standard,
    product: {
        id: "prod-standard-low",
        name: "Standard Low",
        price: 10000,
        vat_percentage: 2500,
        description: "Low priced standard",
        stock: 10,
        image_url: null,
    },
};

const standardHigh: TicketLike = {
    product_id: "prod-standard-high",
    type: TicketType.standard,
    product: {
        id: "prod-standard-high",
        name: "Standard High",
        price: 20000,
        vat_percentage: 2500,
        description: "High priced standard",
        stock: 10,
        image_url: null,
    },
};

const volunteerTicket: TicketLike = {
    product_id: "prod-volunteer",
    type: TicketType.volunteer,
    product: {
        id: "prod-volunteer",
        name: "Volunteer Ticket",
        price: 0,
        vat_percentage: 0,
        description: "Volunteer",
        stock: 10,
        image_url: null,
    },
};

const renderTicketShop = async (
    eventOverrides: Partial<EventLike> = {},
    eventTickets: TicketLike[] = [standardLow],
    eventTasks: TaskLike[] = [],
    goToOrganizeTab = vi.fn(),
) => {
    const event = { ...baseEvent, ...eventOverrides };

    await act(async () => {
        render(
            <NotificationContextProvider>
                <TicketShop
                    eventPromise={Promise.resolve(event as any)}
                    eventTicketsPromise={Promise.resolve(eventTickets as any)}
                    eventTasksPromise={Promise.resolve(eventTasks as any)}
                    goToOrganizeTab={goToOrganizeTab}
                />
            </NotificationContextProvider>,
        );
    });

    return { event, goToOrganizeTab };
};

const fillRequiredTicketFormFields = async () => {
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Test Ticket Name");

    await userEvent.clear(screen.getByRole("textbox", { name: "Price" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Price" }), "100");

    await userEvent.clear(screen.getByRole("textbox", { name: "VAT %" }));
    await userEvent.type(screen.getByRole("textbox", { name: "VAT %" }), "25");

    await selectAutocompleteOption("Ticket Type", "Standard Ticket");
};

describe("TicketShop", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.english,
        } as any);
        vi.mocked(isUserHost).mockReturnValue(false);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(createAndRedirectToOrder).mockResolvedValue(undefined as never);
        vi.mocked(createEventTicket).mockResolvedValue(undefined as never);
        vi.mocked(updateEventTicket).mockResolvedValue(undefined as never);
        vi.mocked(deleteEventTicket).mockResolvedValue(undefined as never);
    });

    it("throws when user is not logged in", () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: null,
            language: Language.english,
        } as any);

        expect(() => {
            render(
                <NotificationContextProvider>
                    <TicketShop
                        eventPromise={Promise.resolve(baseEvent as any)}
                        eventTicketsPromise={Promise.resolve([standardLow] as any)}
                        eventTasksPromise={Promise.resolve([] as any)}
                        goToOrganizeTab={vi.fn()}
                    />
                </NotificationContextProvider>,
            );
        }).toThrow("You must be logged in to view the ticket shop");
    });

    it("renders header and no tickets message when empty", async () => {
        await renderTicketShop({}, []);

        expect(screen.getByText("Tickets")).toBeInTheDocument();
        expect(screen.getByText("No tickets available")).toBeInTheDocument();
    });

    it("shows add ticket button for host/admin and hides for regular user", async () => {
        await renderTicketShop();
        expect(screen.queryByRole("button", { name: "Add Ticket" })).not.toBeInTheDocument();

        vi.mocked(isUserHost).mockReturnValue(true);
        await renderTicketShop();
        expect(screen.getByRole("button", { name: "Add Ticket" })).toBeInTheDocument();
    });

    it("sorts tickets by price within same ticket type", async () => {
        await renderTicketShop({}, [standardHigh, standardLow]);

        const text = document.body.textContent || "";
        expect(text.indexOf("Standard Low")).toBeGreaterThan(-1);
        expect(text.indexOf("Standard High")).toBeGreaterThan(-1);
        expect(text.indexOf("Standard Low")).toBeLessThan(text.indexOf("Standard High"));
    });

    it("creates ticket order when buying a standard ticket", async () => {
        await renderTicketShop({}, [standardLow]);

        await userEvent.click(screen.getByText("Standard Low"));
        await userEvent.click(screen.getByRole("button", { name: "BUY" }));

        await waitFor(() => {
            expect(createAndRedirectToOrder).toHaveBeenCalledWith([
                { product_id: "prod-standard-low", quantity: 1 },
            ]);
        });
    });

    it("shows failed ticket order notification when order creation fails", async () => {
        vi.mocked(createAndRedirectToOrder).mockRejectedValueOnce(
            new Error("order failed") as never,
        );
        await renderTicketShop({}, [standardLow]);

        await userEvent.click(screen.getByText("Standard Low"));
        await userEvent.click(screen.getByRole("button", { name: "BUY" }));

        expect(await screen.findByText("Failed to create ticket order")).toBeInTheDocument();
    });

    it("sends user to organize tab when volunteer ticket is locked", async () => {
        const { goToOrganizeTab } = await renderTicketShop({}, [volunteerTicket], []);

        await userEvent.click(screen.getByText("Volunteer Ticket"));

        expect(goToOrganizeTab).toHaveBeenCalledTimes(1);
    });

    it("does not redirect to organize tab when volunteer ticket is available", async () => {
        const { goToOrganizeTab } = await renderTicketShop(
            {},
            [volunteerTicket],
            [{ id: "task-1", assignee_id: "user-1" }],
        );

        await userEvent.click(screen.getByText("Volunteer Ticket"));

        expect(goToOrganizeTab).not.toHaveBeenCalled();
    });

    it("hides delete action for the only volunteer ticket", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);
        await renderTicketShop({}, [volunteerTicket]);

        expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    });

    it("deletes a ticket through confirmation and shows success notification", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);
        await renderTicketShop({}, [standardLow]);

        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(screen.getByText("Confirm")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Proceed" }));

        await waitFor(() => {
            expect(deleteEventTicket).toHaveBeenCalledWith("prod-standard-low");
        });
        expect(await screen.findByText("Deleted")).toBeInTheDocument();
    });

    it("shows failed-delete notification when deleting a ticket fails", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);
        vi.mocked(deleteEventTicket).mockRejectedValueOnce(new Error("delete failed") as never);
        await renderTicketShop({}, [standardLow]);

        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        await userEvent.click(screen.getByRole("button", { name: "Proceed" }));

        expect(await screen.findByText("Failed to delete")).toBeInTheDocument();
    });

    it("opens create ticket dialog and submits create action", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);
        await renderTicketShop({}, [standardLow]);

        await userEvent.click(screen.getByRole("button", { name: "Add Ticket" }));

        await fillRequiredTicketFormFields();
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(createEventTicket).toHaveBeenCalledTimes(1);
            expect(createEventTicket).toHaveBeenCalledWith("event-1", expect.any(FormData));
        });
    });

    it("opens edit ticket dialog and submits update action with default values", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);
        await renderTicketShop({}, [standardLow]);

        await userEvent.click(screen.getByRole("button", { name: "Edit" }));
        expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Standard Low");
        await selectAutocompleteOption("Ticket Type", "Standard Ticket");

        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(updateEventTicket).toHaveBeenCalledTimes(1);
            expect(updateEventTicket).toHaveBeenCalledWith(
                "prod-standard-low",
                expect.any(FormData),
            );
        });
    });

    it("renders swedish labels", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderTicketShop({}, [standardLow]);

        expect(screen.getByText("Biljetter")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Lägg till Biljett" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Redigera" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Ta bort" })).toBeInTheDocument();
    });
});
