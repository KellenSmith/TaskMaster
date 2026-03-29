import { act, render, screen, within } from "@testing-library/react";
import CalendarDashboard from "./CalendarDashboard";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import LocalizationContextProvider from "../../context/LocalizationContext";
import { useMediaQuery } from "@mui/material";
import { useUserContext } from "../../context/UserContext";
import testdata from "../../../test/testdata";
import { Language } from "../../../prisma/generated/enums";
import NotificationContextProvider from "../../context/NotificationContext";
import { createEvent } from "../../lib/event-actions";
import { getLoggedInUser } from "../../lib/user-helpers";
import { selectAutocompleteOption } from "../../../test/test-helpers";

vi.mock("../../lib/event-actions", () => ({
    createEvent: vi.fn(),
}));
vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));
vi.mock("@mui/material", async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useMediaQuery: vi.fn(() => false), // Default to large screen
    };
});

const events = [
    {
        id: "1",
        title: "Event 1",
        start_time: dayjs("2026-03-10").toDate(),
        end_time: dayjs("2026-03-10").add(1, "hour").toDate(),
        tags: ["Tag1", "Tag2"],
    },
    {
        id: "2",
        title: "Event 2",
        start_time: dayjs("2026-03-15").toDate(),
        end_time: dayjs("2026-03-15").add(1, "hour").toDate(),
        tags: ["Tag2", "Tag3"],
    },
];

const locations = [
    {
        id: "loc1",
        name: "Location 1",
        capacity: 10,
    },
    {
        id: "loc2",
        name: "Location 2",
        capacity: 20,
    },
];

describe("CalendarDashboard", () => {
    it("shows the current month by default", async () => {
        await act(async () => {
            render(
                <CalendarDashboard
                    eventsPromise={Promise.resolve([])}
                    locationsPromise={Promise.resolve([])}
                />,
            );
        });
        const currentMonth = dayjs().format("YYYY/MM");
        expect(await screen.findByText(currentMonth)).toBeInTheDocument();
    });
    it("allows navigating to the next month", async () => {
        await act(async () => {
            render(
                <CalendarDashboard
                    eventsPromise={Promise.resolve([])}
                    locationsPromise={Promise.resolve([])}
                />,
            );
        });

        const nextButton = screen.getByTestId("ArrowRightIcon");
        await userEvent.click(nextButton);

        const nextMonth = dayjs().add(1, "month").format("YYYY/MM");
        expect(await screen.findByText(nextMonth)).toBeInTheDocument();
    });
    it("allows navigating to the previous month", async () => {
        await act(async () => {
            render(
                <CalendarDashboard
                    eventsPromise={Promise.resolve([])}
                    locationsPromise={Promise.resolve([])}
                />,
            );
        });

        const prevButton = screen.getByTestId("ArrowLeftIcon");
        await userEvent.click(prevButton);

        const prevMonth = dayjs().subtract(1, "month").format("YYYY/MM");
        expect(await screen.findByText(prevMonth)).toBeInTheDocument();
    });
    it("renders calendar with correct days if large screen", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(dayjs("2026-03-04T12:00:00Z").toDate()); // Use explicit UTC instant for deterministic behavior
        await act(async () => {
            render(
                <LocalizationContextProvider>
                    <CalendarDashboard
                        eventsPromise={Promise.resolve([])}
                        locationsPromise={Promise.resolve([])}
                    />
                </LocalizationContextProvider>,
            );
        });

        // Days in march 2026 (mocked system time) plus any days from previous/next month to fill the calendar grid
        // Expect 23-28 februari, 1-31 mars, 1-5 april (total 42 cells in a 6x7 calendar grid)
        const calendarCells = screen.getAllByText(new RegExp("^(?:[1-9]|[12][0-9]|3[01])$"));
        expect(calendarCells.length).toBe(42);
    });
    it("renders only days with events if small screen", async () => {
        vi.mocked(useMediaQuery).mockReturnValue(true); // Mock small screen

        await act(async () => {
            render(
                <LocalizationContextProvider>
                    <CalendarDashboard
                        eventsPromise={Promise.resolve(events as any)}
                        locationsPromise={Promise.resolve([])}
                    />
                </LocalizationContextProvider>,
            );
        });

        expect(screen.getByText("Event 1")).toBeInTheDocument();
        expect(screen.getByText("Event 2")).toBeInTheDocument();
        // Expect only the days with events to be rendered (10th and 15th)
        expect(screen.getByText("10")).toBeInTheDocument();
        expect(screen.getByText("15")).toBeInTheDocument();
        // All digits that are not 10 or 15 should not be rendered
        expect(
            screen.queryAllByText(new RegExp("^(?!(?:10|15)$)(?:[1-9]|[12][0-9]|3[01])$")).length,
        ).toBe(0);
    });
    it("renders swedish translations if language is set to swedish", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: testdata.user,
            language: Language.swedish,
        } as any);

        await act(async () => {
            render(
                <LocalizationContextProvider>
                    <CalendarDashboard
                        eventsPromise={Promise.resolve([])}
                        locationsPromise={Promise.resolve([])}
                    />
                </LocalizationContextProvider>,
            );
        });

        expect(screen.getByText("Skapa evenemang")).toBeInTheDocument();
    });
    it("allows creating an event", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(testdata.user);
        vi.mocked(useUserContext).mockReturnValue({
            user: testdata.user,
            language: Language.english,
        } as any);

        await act(async () => {
            render(
                <LocalizationContextProvider>
                    <NotificationContextProvider>
                        <CalendarDashboard
                            eventsPromise={Promise.resolve(events as any)}
                            locationsPromise={Promise.resolve(locations as any)}
                        />
                    </NotificationContextProvider>
                </LocalizationContextProvider>,
            );
        });

        const createButton = screen.getByText("Create event");
        await userEvent.click(createButton);

        expect(await screen.findByRole("dialog")).toBeVisible();
        await userEvent.type(screen.getByRole("textbox", { name: "Title" }), "Test Event");
        await userEvent.type(
            screen.getByRole("textbox", { name: "Maximum no. of participants" }),
            "5",
        );

        const tagsField = screen.getByRole("combobox", { name: "Tags" });
        await userEvent.click(tagsField);
        const tagsOptions = within(await screen.findByRole("listbox")).getAllByRole("option");
        expect(tagsOptions.length).toBe(3);
        await userEvent.click(tagsOptions[0]); // Select first tag

        const locationField = screen.getByRole("combobox", { name: "Location" });
        await userEvent.click(locationField);
        const locationOptions = within(await screen.findByRole("listbox")).getAllByRole("option");
        expect(locationOptions.length).toBe(2);
        await userEvent.click(locationOptions[0]); // Select first location

        const saveButton = screen.getByRole("button", { name: /create draft/i });
        await userEvent.click(saveButton);

        expect(createEvent).toHaveBeenCalledWith(expect.any(FormData));
        expect(await screen.findByText(/saved/i)).toBeInTheDocument();
    });
    it("handles location capacity exceeded error when creating an event", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: testdata.user,
            language: Language.english,
        } as any);

        await act(async () => {
            render(
                <LocalizationContextProvider>
                    <NotificationContextProvider>
                        <CalendarDashboard
                            eventsPromise={Promise.resolve(events as any)}
                            locationsPromise={Promise.resolve(locations as any)}
                        />
                    </NotificationContextProvider>
                </LocalizationContextProvider>,
            );
        });

        const createButton = screen.getByText("Create event");
        await userEvent.click(createButton);

        expect(await screen.findByRole("dialog")).toBeVisible();
        await userEvent.type(screen.getByRole("textbox", { name: "Title" }), "Test Event");
        await userEvent.type(
            screen.getByRole("textbox", { name: "Maximum no. of participants" }),
            "50",
        );
        await selectAutocompleteOption("Location", "Location 1");

        const saveButton = screen.getByRole("button", { name: /create draft/i });
        await userEvent.click(saveButton);

        expect(
            await screen.findByText(/The location can only handle 10 participants/i),
        ).toBeInTheDocument();
        expect(createEvent).not.toHaveBeenCalledWith();
    });
    it("shows error notification when event creation fails", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: testdata.user,
            language: Language.english,
        } as any);
        vi.mocked(createEvent).mockRejectedValue(new Error("Failed to create event"));

        await act(async () => {
            render(
                <LocalizationContextProvider>
                    <NotificationContextProvider>
                        <CalendarDashboard
                            eventsPromise={Promise.resolve(events as any)}
                            locationsPromise={Promise.resolve(locations as any)}
                        />
                    </NotificationContextProvider>
                </LocalizationContextProvider>,
            );
        });

        const createButton = screen.getByText("Create event");
        await userEvent.click(createButton);

        expect(await screen.findByRole("dialog")).toBeVisible();
        await userEvent.type(screen.getByRole("textbox", { name: "Title" }), "Test Event");
        await userEvent.type(
            screen.getByRole("textbox", { name: "Maximum no. of participants" }),
            "5",
        );
        await selectAutocompleteOption("Location", "Location 1");

        const saveButton = screen.getByRole("button", { name: /create draft/i });
        await userEvent.click(saveButton);

        expect(createEvent).toHaveBeenCalledWith(expect.any(FormData));
        expect(await screen.findByText(/failed to save/i)).toBeInTheDocument();
    });
});
