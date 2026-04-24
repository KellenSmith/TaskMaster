import { act, render, screen } from "@testing-library/react";
import CalendarDay from "./CalendarDay";
import dayjs from "../../lib/dayjs";
import { useUserContext } from "../../context/UserContext";
import { Language } from "../../../prisma/generated/enums";
import { useMediaQuery } from "@mui/material";
import LocalizationContextProvider from "../../context/LocalizationContext";

vi.mock("@mui/material", async (importActual) => {
    const actual = await importActual();
    return {
        ...(actual as any),
        useMediaQuery: vi.fn(() => false),
    };
});

const testDate = dayjs("2026-03-04");

const baseEvent = {
    id: "1",
    title: "Event 1",
    description: "Description 1",
    start_time: testDate.hour(10).minute(0).second(0).toDate(),
    end_time: testDate.hour(11).minute(0).second(0).toDate(),
};

const renderCalendarDay = async (eventsPromise: Promise<any[]>) => {
    await act(async () =>
        render(
            <LocalizationContextProvider>
                <CalendarDay date={testDate} eventsPromise={eventsPromise} />
            </LocalizationContextProvider>,
        ),
    );
};

describe("CalendarDay", () => {
    it("renders date number when screen is large", async () => {
        await renderCalendarDay(Promise.resolve([]));

        expect(screen.getByText("4")).toBeInTheDocument();
    });
    it("renders date number and name when screen is small", async () => {
        vi.mocked(useMediaQuery).mockReturnValue(true);

        await renderCalendarDay(Promise.resolve([baseEvent]));

        expect(screen.getByText("4")).toBeInTheDocument();
        expect(screen.getByText(/wed/i)).toBeInTheDocument();
    });
    it("renders swedish day name when language is set to Swedish and screen is small", async () => {
        vi.mocked(useUserContext).mockReturnValue({ language: Language.swedish } as any);
        vi.mocked(useMediaQuery).mockReturnValue(true);

        await renderCalendarDay(Promise.resolve([baseEvent]));

        expect(screen.getByText("4")).toBeInTheDocument();
        expect(screen.getByText(/ons/i)).toBeInTheDocument();
    });
    it("renders events that start and end on the same day", async () => {
        await renderCalendarDay(Promise.resolve([baseEvent]));

        expect(screen.getByText("Event 1")).toBeInTheDocument();
    });
    it("renders events that start on the previous day and end on the current day", async () => {
        const event = {
            ...baseEvent,
            start_time: testDate.subtract(1, "day").hour(22).minute(0).second(0).toDate(),
            end_time: testDate.hour(2).minute(0).second(0).toDate(),
        };
        await renderCalendarDay(Promise.resolve([event]));

        expect(screen.getByText("Event 1")).toBeInTheDocument();
    });
    it("renders events that start on the current day and end on the next day", async () => {
        const event = {
            ...baseEvent,
            start_time: testDate.hour(22).minute(0).second(0).toDate(),
            end_time: testDate.add(1, "day").hour(2).minute(0).second(0).toDate(),
        };
        await renderCalendarDay(Promise.resolve([event]));

        expect(screen.getByText("Event 1")).toBeInTheDocument();
    });
    it("renders events that span across the current day", async () => {
        const event = {
            ...baseEvent,
            start_time: testDate.subtract(1, "day").hour(22).minute(0).second(0).toDate(),
            end_time: testDate.add(1, "day").hour(2).minute(0).second(0).toDate(),
        };
        await renderCalendarDay(Promise.resolve([event]));

        expect(screen.getByText("Event 1")).toBeInTheDocument();
    });
    it("does not render events that do not occur on the current day", async () => {
        const event = {
            ...baseEvent,
            start_time: testDate.subtract(2, "day").hour(22).minute(0).second(0).toDate(),
            end_time: testDate.subtract(2, "day").hour(23).minute(0).second(0).toDate(),
        };
        await renderCalendarDay(Promise.resolve([event]));

        expect(screen.queryByText("Event 1")).not.toBeInTheDocument();
    });
    it("renders an empty day component when there are no events and screen is large", async () => {
        await renderCalendarDay(Promise.resolve([]));

        expect(screen.getByRole("heading", { name: "4" })).toBeInTheDocument();
    });
    it("renders nothing when there are no events and screen is small", async () => {
        vi.mocked(useMediaQuery).mockReturnValue(true);

        await renderCalendarDay(Promise.resolve([]));

        expect(screen.queryByRole("heading", { name: "4" })).not.toBeInTheDocument();
    });
});
