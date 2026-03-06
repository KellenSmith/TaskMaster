import { act, render, screen, within } from "@testing-library/react";
import { useMediaQuery } from "@mui/material";
import EventDetails from "./EventDetails";
import { useUserContext } from "../../context/UserContext";
import { Language } from "../../../prisma/generated/enums";
import { formatDate } from "../../ui/utils";
import { taskFieldLabels } from "../../ui/form/LanguageTranslations";
import LocalizationContextProvider from "../../context/LocalizationContext";

vi.mock("@mui/material", async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useMediaQuery: vi.fn(() => false),
    };
});

type EventDetailsLike = {
    start_time: Date;
    end_time: Date;
    description: string;
    tags?: string[];
    location?: { name: string; address: string } | null;
};

const baseEvent: EventDetailsLike = {
    start_time: new Date("2026-06-01T10:00:00Z"),
    end_time: new Date("2026-06-01T12:00:00Z"),
    description: "Event description",
    tags: ["Before", "During"],
    location: {
        name: "Hall A",
        address: "Main Street 1",
    },
};

const renderEventDetails = async (eventOverrides: Partial<EventDetailsLike> = {}) => {
    const event = {
        ...baseEvent,
        ...eventOverrides,
    };

    await act(async () => {
        render(
            <LocalizationContextProvider>
                <EventDetails eventPromise={Promise.resolve(event as any)} />
            </LocalizationContextProvider>,
        );
    });

    return event;
};

describe("EventDetails", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.english,
        } as any);
        vi.mocked(useMediaQuery).mockReturnValue(false);
    });

    it("renders translated start and end labels in english", async () => {
        await renderEventDetails();

        const labelsBlock = screen.getByText(/Start\s*:.*End\s*:/, { selector: "p" });
        expect(labelsBlock).toHaveTextContent(/Start\s*:/);
        expect(labelsBlock).toHaveTextContent(/End\s*:/);
    });

    it("renders formatted start and end date values", async () => {
        const event = await renderEventDetails({
            start_time: new Date("2026-08-10T09:15:00Z"),
            end_time: new Date("2026-08-10T11:45:00Z"),
        });

        const datesBlock = screen.getByText(
            new RegExp(`${formatDate(event.start_time)}.*${formatDate(event.end_time)}`),
            { selector: "p" },
        );
        expect(datesBlock).toHaveTextContent(formatDate(event.start_time));
        expect(datesBlock).toHaveTextContent(formatDate(event.end_time));
    });

    it("renders location name and address when location is provided", async () => {
        await renderEventDetails({
            location: {
                name: "City Hub",
                address: "Example Road 42",
            },
        });

        expect(screen.getByText("City Hub, Example Road 42")).toBeInTheDocument();
    });

    it("does not render location row when location is null", async () => {
        await renderEventDetails({ location: null });

        expect(screen.queryByText(/Hall A|Main Street 1/)).not.toBeInTheDocument();
    });

    it("renders tags heading and one chip per tag", async () => {
        await renderEventDetails({ tags: ["Before", "During", "After"] });

        expect(screen.getByText(taskFieldLabels.tags[Language.english])).toBeInTheDocument();

        const tagsList = screen.getByRole("list");
        expect(within(tagsList).getAllByRole("listitem")).toHaveLength(3);
        expect(screen.getByText("Before")).toBeInTheDocument();
        expect(screen.getByText("During")).toBeInTheDocument();
        expect(screen.getByText("After")).toBeInTheDocument();
    });

    it("does not render tags section when tags are empty", async () => {
        await renderEventDetails({ tags: [] });

        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect(screen.queryByText(taskFieldLabels.tags[Language.english])).not.toBeInTheDocument();
    });

    it("does not render tags section when tags are undefined", async () => {
        await renderEventDetails({ tags: undefined });

        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect(screen.queryByText(taskFieldLabels.tags[Language.english])).not.toBeInTheDocument();
    });

    it("renders description via rich text field", async () => {
        await renderEventDetails({ description: "Detailed event body" });

        expect(screen.getByText("Detailed event body")).toBeInTheDocument();
    });

    it("renders translated labels in swedish", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);

        await renderEventDetails();

        const labelsBlock = screen.getByText(/Start\s*:.*Slut\s*:/, { selector: "p" });
        expect(labelsBlock).toHaveTextContent(/Start\s*:/);
        expect(labelsBlock).toHaveTextContent(/Slut\s*:/);
        expect(screen.getByText(taskFieldLabels.tags[Language.swedish])).toBeInTheDocument();
    });

    it("renders small chips on small screens", async () => {
        vi.mocked(useMediaQuery).mockReturnValue(true);

        await renderEventDetails({ tags: ["Before"] });

        const listItem = screen.getByRole("listitem");
        expect(listItem).toHaveClass("MuiChip-sizeSmall");
    });

    it("renders medium chips on non-small screens", async () => {
        vi.mocked(useMediaQuery).mockReturnValue(false);

        await renderEventDetails({ tags: ["Before"] });

        const listItem = screen.getByRole("listitem");
        expect(listItem).toHaveClass("MuiChip-sizeMedium");
    });
});
