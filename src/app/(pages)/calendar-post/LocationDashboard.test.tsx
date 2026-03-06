import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LocationDashboard from "./LocationDashboard";
import { useUserContext } from "../../context/UserContext";
import { isUserAdmin, isUserHost } from "../../lib/utils";
import { updateEvent } from "../../lib/event-actions";
import { Language } from "../../../prisma/generated/enums";
import GlobalConstants from "../../GlobalConstants";
import NotificationContextProvider from "../../context/NotificationContext";

vi.mock("../../lib/utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        isUserAdmin: vi.fn(() => false),
        isUserHost: vi.fn(() => false),
    };
});

vi.mock("../../lib/event-actions", () => ({
    updateEvent: vi.fn(),
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

type EventLike = {
    id: string;
    location_id: string | null;
    max_participants: number;
    location: LocationLike | null;
};

const baseLocations: LocationLike[] = [
    {
        id: "loc-1",
        name: "Hall A",
        address: "Main Street 1",
        capacity: 40,
        contact_person: "Alex",
        rental_cost: 1000,
        accessibility_info: "Lift",
        description: "Primary venue",
    },
    {
        id: "loc-2",
        name: "Hall B",
        address: "Second Street 2",
        capacity: 12,
        contact_person: "Sam",
        rental_cost: 500,
        accessibility_info: "Ramp",
        description: "Backup venue",
    },
];

const baseEvent: EventLike = {
    id: "event-1",
    location_id: "loc-1",
    max_participants: 10,
    location: baseLocations[0],
};

const renderLocationDashboard = async (
    eventOverrides: Partial<EventLike> = {},
    locations: LocationLike[] = baseLocations,
) => {
    const event = {
        ...baseEvent,
        ...eventOverrides,
    };

    await act(async () => {
        render(
            <NotificationContextProvider>
                <LocationDashboard
                    eventPromise={Promise.resolve(event as any)}
                    locationsPromise={Promise.resolve(locations as any)}
                />
            </NotificationContextProvider>,
        );
    });

    return { event, locations };
};

describe("LocationDashboard", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.english,
        } as any);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(isUserHost).mockReturnValue(false);
        vi.mocked(updateEvent).mockResolvedValue(undefined as never);
    });

    it("renders no-location note when event has no location", async () => {
        await renderLocationDashboard({ location: null, location_id: null });

        expect(screen.getByText("No location information available")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: /hall/i })).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Switch Event Location" }),
        ).not.toBeInTheDocument();
    });

    it("renders location card with current event location", async () => {
        await renderLocationDashboard();

        expect(screen.getByRole("heading", { name: "Hall A" })).toBeInTheDocument();
        expect(screen.getByText("Address")).toBeInTheDocument();
        expect(screen.getByText("Main Street 1")).toBeInTheDocument();
    });

    it("uses limited location fields for non-host non-admin users", async () => {
        await renderLocationDashboard();

        // Should show these fields for regular users
        expect(screen.getByText("Address")).toBeInTheDocument();
        expect(screen.getByText("Accessibility Info")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();

        // Should NOT show these fields for regular users
        expect(screen.queryByText("Capacity [# people]")).not.toBeInTheDocument();
        expect(screen.queryByText("Contact Person")).not.toBeInTheDocument();
        expect(screen.queryByText("Rental Cost [SEK]")).not.toBeInTheDocument();
    });

    it("shows switch controls for admin when more than one location exists", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderLocationDashboard();

        expect(screen.getByRole("combobox", { name: "Location" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Switch Event Location" })).toBeInTheDocument();
    });

    it("hides switch controls when only one location exists", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderLocationDashboard({}, [baseLocations[0]]);

        expect(screen.queryByRole("combobox", { name: "Location" })).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Switch Event Location" }),
        ).not.toBeInTheDocument();
    });

    it("disables switch button when selected location is current event location", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderLocationDashboard();

        expect(screen.getByRole("button", { name: "Switch Event Location" })).toBeDisabled();
    });

    it("enables switch and updates preview when selecting another location", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderLocationDashboard();

        const locationInput = screen.getByRole("combobox", { name: "Location" });
        await userEvent.clear(locationInput);
        await userEvent.type(locationInput, "Hall B");
        await userEvent.click(await screen.findByRole("option", { name: "Hall B" }));

        expect(screen.getByRole("button", { name: "Switch Event Location" })).toBeEnabled();
        expect(screen.getByRole("heading", { name: "Hall B" })).toBeInTheDocument();
    });

    it("submits selected location id and shows success notification", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderLocationDashboard();

        const locationInput = screen.getByRole("combobox", { name: "Location" });
        await userEvent.clear(locationInput);
        await userEvent.type(locationInput, "Hall B");
        await userEvent.click(await screen.findByRole("option", { name: "Hall B" }));
        await userEvent.click(screen.getByRole("button", { name: "Switch Event Location" }));

        await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
        const [, formData] = vi.mocked(updateEvent).mock.calls[0];
        expect((formData as FormData).get(GlobalConstants.LOCATION_ID)).toBe("loc-2");
        expect(await screen.findByText("Saved")).toBeInTheDocument();
    });

    it("shows failed-save notification when updateEvent throws", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);
        vi.mocked(updateEvent).mockRejectedValue(new Error("update failed") as never);

        await renderLocationDashboard();

        const locationInput = screen.getByRole("combobox", { name: "Location" });
        await userEvent.clear(locationInput);
        await userEvent.type(locationInput, "Hall B");
        await userEvent.click(await screen.findByRole("option", { name: "Hall B" }));
        await userEvent.click(screen.getByRole("button", { name: "Switch Event Location" }));

        expect(await screen.findByText("Failed to save")).toBeInTheDocument();
    });

    it("disables switch and shows capacity warning when selected location capacity is exceeded", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderLocationDashboard({ max_participants: 20 });

        const locationInput = screen.getByRole("combobox", { name: "Location" });
        await userEvent.clear(locationInput);
        await userEvent.type(locationInput, "Hall B");
        await userEvent.click(await screen.findByRole("option", { name: "Hall B" }));

        expect(screen.getByRole("button", { name: "Switch Event Location" })).toBeDisabled();
        expect(
            screen.getByText("The location can only handle 12 participants"),
        ).toBeInTheDocument();
    });

    it("renders swedish labels when language is swedish", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderLocationDashboard();

        expect(screen.getByRole("combobox", { name: "Plats" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Byt Evenemangets Plats" })).toBeInTheDocument();
    });
});
