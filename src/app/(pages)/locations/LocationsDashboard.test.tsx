import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LocationsDashboard from "./LocationsDashboard";
import NotificationContextProvider from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";
import { createLocation, deleteLocation, updateLocation } from "../../lib/location-actions";
import { Language } from "../../../prisma/generated/enums";

vi.mock("../../lib/location-actions", () => ({
    createLocation: vi.fn(),
    updateLocation: vi.fn(),
    deleteLocation: vi.fn(),
}));

type LocationLike = {
    id: string;
    name: string;
    address: string;
    capacity: number;
    contact_person?: string;
    rental_cost?: number;
    accessibility_info?: string;
    description?: string;
};

const baseLocations: LocationLike[] = [
    {
        id: "loc-2",
        name: "Bravo Hall",
        address: "Second Street 2",
        capacity: 80,
        contact_person: "Bob",
        rental_cost: 2000,
        accessibility_info: "Ramp",
        description: "Second location",
    },
    {
        id: "loc-1",
        name: "Alpha Hall",
        address: "Main Street 1",
        capacity: 120,
        contact_person: "Alice",
        rental_cost: 3000,
        accessibility_info: "Elevator",
        description: "Primary location",
    },
];

const renderLocationsDashboard = async (locations: LocationLike[] = baseLocations) => {
    await act(async () => {
        render(
            <NotificationContextProvider>
                <LocationsDashboard locationsPromise={Promise.resolve(locations as any)} />
            </NotificationContextProvider>,
        );
    });
};

const fillRequiredLocationFields = async () => {
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "New Venue");
    await userEvent.clear(screen.getByRole("textbox", { name: "Address" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Address" }), "New Street 10");
    await userEvent.clear(screen.getByRole("textbox", { name: "Capacity [# people]" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Capacity [# people]" }), "50");
};

describe("LocationsDashboard", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.english,
        } as any);
        vi.mocked(createLocation).mockResolvedValue(undefined as never);
        vi.mocked(updateLocation).mockResolvedValue(undefined as never);
        vi.mocked(deleteLocation).mockResolvedValue(undefined as never);
    });

    it("renders add location button and location cards", async () => {
        await renderLocationsDashboard();

        expect(screen.getByRole("button", { name: "Add Location" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Alpha Hall" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Bravo Hall" })).toBeInTheDocument();
    });

    it("sorts locations alphabetically by name", async () => {
        await renderLocationsDashboard();

        const locationHeadings = screen
            .getAllByRole("heading", { level: 3 })
            .map((n) => n.textContent);
        expect(locationHeadings).toEqual(["Alpha Hall", "Bravo Hall"]);
    });

    it("opens create dialog when add location is clicked", async () => {
        await renderLocationsDashboard();

        await userEvent.click(screen.getByRole("button", { name: "Add Location" }));

        expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("creates location through form submit and closes dialog", async () => {
        await renderLocationsDashboard();

        await userEvent.click(screen.getByRole("button", { name: "Add Location" }));
        await fillRequiredLocationFields();
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(createLocation).toHaveBeenCalledTimes(1);
            expect(createLocation).toHaveBeenCalledWith(expect.any(FormData));
        });
        expect(await screen.findByText("Saved")).toBeInTheDocument();
    });

    it("shows failed-save notification when create location fails", async () => {
        vi.mocked(createLocation).mockRejectedValueOnce(new Error("create failed") as never);
        await renderLocationsDashboard();

        await userEvent.click(screen.getByRole("button", { name: "Add Location" }));
        await fillRequiredLocationFields();
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(await screen.findByText("Failed to save")).toBeInTheDocument();
    });

    it("opens edit dialog with default values", async () => {
        await renderLocationsDashboard();

        await userEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);

        expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Alpha Hall");
        expect(screen.getByRole("textbox", { name: "Address" })).toHaveValue("Main Street 1");
    });

    it("updates location on save from edit dialog", async () => {
        await renderLocationsDashboard();

        await userEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
        await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
        await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Alpha Hall Updated");
        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(updateLocation).toHaveBeenCalledTimes(1);
            expect(updateLocation).toHaveBeenCalledWith("loc-1", expect.any(FormData));
        });
        expect(await screen.findByText("Saved")).toBeInTheDocument();
    });

    it("deletes location and shows success notification", async () => {
        await renderLocationsDashboard();

        await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

        await waitFor(() => {
            expect(deleteLocation).toHaveBeenCalledTimes(1);
            expect(deleteLocation).toHaveBeenCalledWith("loc-1");
        });
        expect(await screen.findByText("Deleted")).toBeInTheDocument();
    });

    it("shows failed-delete notification when delete fails", async () => {
        vi.mocked(deleteLocation).mockRejectedValueOnce(new Error("delete failed") as never);
        await renderLocationsDashboard();

        await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

        expect(await screen.findByText("Failed to delete")).toBeInTheDocument();
    });

    it("closes dialog when cancel is clicked from edit mode", async () => {
        await renderLocationsDashboard();

        await userEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
        expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await waitFor(() => {
            expect(screen.queryByRole("textbox", { name: "Name" })).not.toBeInTheDocument();
        });
    });

    it("renders swedish labels when language is swedish", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);

        await renderLocationsDashboard();

        expect(screen.getByRole("button", { name: "Lägg till lokal" })).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Redigera" }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole("button", { name: "Ta bort" }).length).toBeGreaterThan(0);
    });
});
