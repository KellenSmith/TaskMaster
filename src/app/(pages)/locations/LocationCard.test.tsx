import { render, screen } from "@testing-library/react";
import LocationCard from "./LocationCard";
import { useUserContext } from "../../context/UserContext";
import GlobalConstants from "../../GlobalConstants";
import { Language } from "../../../prisma/generated/enums";

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

const baseLocation: LocationLike = {
    id: "loc-1",
    name: "Alpha Hall",
    address: "Main Street 1",
    capacity: 120,
    contact_person: "Alice",
    rental_cost: 3000,
    accessibility_info: "Ramp access",
    description: "<p>Large and bright venue</p>",
};

const renderLocationCard = (
    renderedFields: string[] = [
        GlobalConstants.NAME,
        GlobalConstants.ADDRESS,
        GlobalConstants.CAPACITY,
        GlobalConstants.DESCRIPTION,
    ],
    location: LocationLike = baseLocation,
) => {
    render(<LocationCard location={location as any} renderedFields={renderedFields} />);
};

describe("LocationCard", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.english,
        } as any);
    });

    it("renders location heading and icon", () => {
        renderLocationCard();

        expect(screen.getByRole("heading", { level: 3, name: "Alpha Hall" })).toBeInTheDocument();
        expect(screen.getByTestId("LocationOnIcon")).toBeInTheDocument();
    });

    it("renders labels and values for non-description fields", () => {
        renderLocationCard([
            GlobalConstants.NAME,
            GlobalConstants.CONTACT_PERSON,
            GlobalConstants.ADDRESS,
            GlobalConstants.CAPACITY,
            GlobalConstants.RENTAL_COST,
        ]);

        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Contact Person")).toBeInTheDocument();
        expect(screen.getByText("Address")).toBeInTheDocument();
        expect(screen.getByText("Capacity [# people]")).toBeInTheDocument();
        expect(screen.getByText("Rental Cost [SEK]")).toBeInTheDocument();

        expect(screen.getAllByText("Alpha Hall").length).toBeGreaterThan(0);
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Main Street 1")).toBeInTheDocument();
        expect(screen.getByText("120")).toBeInTheDocument();
        expect(screen.getByText("3000")).toBeInTheDocument();
    });

    it("renders rich text content for description field", () => {
        renderLocationCard([GlobalConstants.DESCRIPTION]);

        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Large and bright venue")).toBeInTheDocument();
    });

    it("renders only the requested fields", () => {
        renderLocationCard([GlobalConstants.NAME, GlobalConstants.ADDRESS]);

        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Address")).toBeInTheDocument();

        expect(screen.queryByText("Capacity [# people]")).not.toBeInTheDocument();
        expect(screen.queryByText("Contact Person")).not.toBeInTheDocument();
        expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    it("renders swedish field labels when language is swedish", () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);

        renderLocationCard([
            GlobalConstants.NAME,
            GlobalConstants.ADDRESS,
            GlobalConstants.CAPACITY,
            GlobalConstants.DESCRIPTION,
        ]);

        expect(screen.getByText("Namn")).toBeInTheDocument();
        expect(screen.getByText("Adress")).toBeInTheDocument();
        expect(screen.getByText("Kapacitet [# personer]")).toBeInTheDocument();
        expect(screen.getByText("Beskrivning")).toBeInTheDocument();
    });

    it("renders empty description safely", () => {
        renderLocationCard([GlobalConstants.DESCRIPTION], {
            ...baseLocation,
            description: "",
        });

        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.queryByText("Large and bright venue")).not.toBeInTheDocument();
    });
});
