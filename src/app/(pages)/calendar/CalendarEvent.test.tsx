import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CalendarEvent from "./CalendarEvent";
import { EventStatus } from "../../../prisma/generated/enums";
import { useUserContext } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import { clientRedirect } from "../../lib/utils";
import GlobalConstants from "../../GlobalConstants";
import { formatDate } from "../../ui/utils";
import dayjs from "../../lib/dayjs";

vi.mock("../../lib/utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        clientRedirect: vi.fn(),
    };
});

const theme = createTheme({
    palette: {
        warning: { main: "#111111", light: "#111111" },
        info: { main: "#222222", light: "#222222" },
        primary: { main: "#333333", dark: "#333333" },
        error: { main: "#444444", dark: "#444444" },
        grey: { 500: "#555555" },
    },
});

const toRgb = (color: string) => {
    const sample = document.createElement("div");
    sample.style.color = color;
    document.body.appendChild(sample);
    const rgb = getComputedStyle(sample).color;
    document.body.removeChild(sample);
    return rgb;
};

type CalendarEventLike = {
    id: string;
    title: string;
    start_time: Date;
    end_time: Date;
    status: EventStatus;
    tags?: string[];
};

const baseEvent: CalendarEventLike = {
    id: "event-1234",
    title: "Summer Coding Workshop",
    start_time: dayjs("2026-06-15T09:00:00").toDate(),
    end_time: dayjs("2026-06-15T17:00:00").toDate(),
    status: EventStatus.published,
    tags: [],
};

const renderCalendarEvent = (eventOverrides: Partial<CalendarEventLike> = {}) => {
    const event = {
        ...baseEvent,
        ...eventOverrides,
    };

    render(
        <ThemeProvider theme={theme}>
            <CalendarEvent event={event as any} />
        </ThemeProvider>,
    );

    return event;
};

const setUserAgent = (userAgent: string) => {
    Object.defineProperty(window.navigator, "userAgent", {
        value: userAgent,
        configurable: true,
    });
};

describe("CalendarEvent", () => {
    it("renders event title in the card body", () => {
        renderCalendarEvent();

        expect(screen.getByText(baseEvent.title)).toBeInTheDocument();
    });

    it("deduplicates tags before rendering chips", () => {
        renderCalendarEvent({ tags: ["Before", "Before", "During"] });

        expect(screen.getAllByText("Before")).toHaveLength(1);
        expect(screen.getByText("During")).toBeInTheDocument();
    });

    it("renders at most two tag chips in compact mode", () => {
        renderCalendarEvent({ tags: ["Before", "During", "After"] });

        expect(screen.getByText("Before")).toBeInTheDocument();
        expect(screen.getByText("During")).toBeInTheDocument();
        expect(screen.queryByText("After")).not.toBeInTheDocument();
    });

    it("renders +N overflow chip when more than two unique tags exist", () => {
        renderCalendarEvent({ tags: ["Before", "During", "After", "Extra"] });

        expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("does not render tag chips when tags are undefined", () => {
        renderCalendarEvent({ tags: undefined });

        expect(screen.queryByText("Before")).not.toBeInTheDocument();
        expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });

    it("does not render tag chips when tags are empty", () => {
        renderCalendarEvent({ tags: [] });

        expect(screen.queryByText("Before")).not.toBeInTheDocument();
        expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });

    it.each([
        ["warning color for draft events", EventStatus.draft, theme.palette.warning.light],
        [
            "info color for pending approval events",
            EventStatus.pending_approval,
            theme.palette.info.light,
        ],
        [
            "primary dark color for published events",
            EventStatus.published,
            theme.palette.primary.dark,
        ],
        ["error dark color for cancelled events", EventStatus.cancelled, theme.palette.error.dark],
    ])("uses %s", (_label, status, expectedColor) => {
        renderCalendarEvent({ status });

        const card = screen.getByText(baseEvent.title).closest(".MuiCard-root");
        expect(card).toBeInTheDocument();
        expect(getComputedStyle(card as HTMLElement).backgroundColor).toBe(toRgb(expectedColor));
    });

    it("falls back to grey color for unknown status values", () => {
        renderCalendarEvent({ status: "unknown_status" as any });

        const card = screen.getByText(baseEvent.title).closest(".MuiCard-root");
        expect(card).toBeInTheDocument();
        expect(getComputedStyle(card as HTMLElement).backgroundColor).toBe(
            toRgb(theme.palette.grey[500]),
        );
    });

    it("applies line-through text decoration when event is cancelled", () => {
        renderCalendarEvent({ status: EventStatus.cancelled });

        const card = screen.getByText(baseEvent.title).closest(".MuiCard-root");
        expect(card).toBeInTheDocument();
        expect(card).toHaveStyle("text-decoration: line-through");
    });

    it("adds pointer cursor and click handler when user is present", async () => {
        const mockRouter = { push: vi.fn() };
        vi.mocked(useRouter).mockReturnValue(mockRouter as any);
        vi.mocked(useUserContext).mockReturnValue({ user: { id: "user-id" } } as any);

        renderCalendarEvent();
        const card = screen.getByText(baseEvent.title).closest(".MuiCard-root");

        expect(card).toBeInTheDocument();
        expect(getComputedStyle(card as HTMLElement).cursor).toBe("pointer");

        await userEvent.click(screen.getByText(baseEvent.title));
        expect(clientRedirect).toHaveBeenCalledTimes(1);
    });

    it("does not attach click handler when user is not present", async () => {
        vi.mocked(useUserContext).mockReturnValue({ user: null } as any);

        renderCalendarEvent();
        await userEvent.click(screen.getByText(baseEvent.title));

        expect(clientRedirect).not.toHaveBeenCalled();
    });

    it("calls clientRedirect with calendar post route and event id on click", async () => {
        const mockRouter = { push: vi.fn() };
        vi.mocked(useRouter).mockReturnValue(mockRouter as any);
        vi.mocked(useUserContext).mockReturnValue({ user: { id: "user-id" } } as any);

        const event = renderCalendarEvent({ id: "event-for-redirect" });
        await userEvent.click(screen.getByText(baseEvent.title));

        expect(clientRedirect).toHaveBeenCalledWith(mockRouter, [GlobalConstants.CALENDAR_POST], {
            [GlobalConstants.EVENT_ID]: event.id,
        });
    });

    it("wraps card in tooltip on desktop user agents", async () => {
        setUserAgent("Mozilla/5.0 (X11; Linux x86_64)");

        renderCalendarEvent();
        await userEvent.hover(screen.getByText(baseEvent.title));

        expect(await screen.findByRole("tooltip")).toBeInTheDocument();
    });

    it("uses formatted start and end times in tooltip title", async () => {
        setUserAgent("Mozilla/5.0 (X11; Linux x86_64)");

        const event = renderCalendarEvent({
            start_time: dayjs("2026-08-01T10:30:00").toDate(),
            end_time: dayjs("2026-08-01T12:45:00").toDate(),
        });
        const expectedTitle = `${formatDate(event.start_time)} - ${formatDate(event.end_time)}`;

        await userEvent.hover(screen.getByText(baseEvent.title));

        expect(await screen.findByRole("tooltip")).toHaveTextContent(expectedTitle);
    });

    it("does not render tooltip wrapper on mobile user agents", async () => {
        setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");

        renderCalendarEvent();
        await userEvent.hover(screen.getByText(baseEvent.title));

        await waitFor(() => {
            expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        });
    });
});
