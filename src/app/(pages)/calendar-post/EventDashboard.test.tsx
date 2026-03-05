import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMediaQuery } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import EventDashboard from "./EventDashboard";
import testdata from "../../../test/testdata";
import { Language, EventStatus } from "../../../prisma/generated/enums";
import { useUserContext } from "../../context/UserContext";
import { clientRedirect, isUserAdmin, isUserHost } from "../../lib/utils";
import { isEventCancelled, isEventSoldOut, isUserParticipant } from "./event-utils";
import { implementedTabs } from "./LanguageTranslations";
import GlobalConstants from "../../GlobalConstants";

vi.mock("@mui/material", async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useMediaQuery: vi.fn(() => false),
    };
});

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    redirect: vi.fn(),
}));

vi.mock("../../lib/utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        clientRedirect: vi.fn(),
        isUserHost: vi.fn(() => false),
        isUserAdmin: vi.fn(() => false),
    };
});

vi.mock("./event-utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        isEventCancelled: vi.fn(() => false),
        isEventSoldOut: vi.fn(() => false),
        isUserParticipant: vi.fn(() => false),
    };
});

vi.mock("./EventDetails", () => ({
    __esModule: true,
    default: () => <div data-testid="event-details">EventDetails</div>,
}));
vi.mock("./LocationDashboard", () => ({
    __esModule: true,
    default: () => <div data-testid="location-dashboard">LocationDashboard</div>,
}));
vi.mock("../../ui/kanban-board/KanBanBoard", () => ({
    __esModule: true,
    default: ({ readOnly }: { readOnly: boolean }) => (
        <div data-testid="kanban-board">{readOnly ? "readonly" : "editable"}</div>
    ),
}));
vi.mock("./TicketDashboard", () => ({
    __esModule: true,
    default: () => <div data-testid="ticket-dashboard">TicketDashboard</div>,
}));
vi.mock("./TicketShop", () => ({
    __esModule: true,
    default: ({ goToOrganizeTab }: { goToOrganizeTab: () => void }) => (
        <>
            <div data-testid="ticket-shop">TicketShop</div>
            <button onClick={goToOrganizeTab}>Go organize</button>
        </>
    ),
}));
vi.mock("./ParticipantDashboard", () => ({
    __esModule: true,
    default: () => <div data-testid="participant-dashboard">ParticipantDashboard</div>,
}));
vi.mock("./ReserveDashboard", () => ({
    __esModule: true,
    default: () => <div data-testid="reserve-dashboard">ReserveDashboard</div>,
}));
vi.mock("./EventActions", () => ({
    __esModule: true,
    default: ({ eventTags }: { eventTags: string[] }) => (
        <div data-testid="event-actions">{eventTags.join(",")}</div>
    ),
}));
vi.mock("../../ui/ErrorBoundarySuspense", () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="error-boundary">{children}</div>
    ),
}));

const baseEvent = {
    id: "event-1234",
    title: "Summer Coding Workshop",
    status: EventStatus.published,
    max_participants: 10,
};

const createProps = (eventOverrides: Record<string, any> = {}) => {
    const event = { ...baseEvent, ...eventOverrides };
    return {
        event,
        props: {
            eventPromise: Promise.resolve(event as any),
            eventTasksPromise: Promise.resolve([] as any),
            eventTicketsPromise: Promise.resolve([] as any),
            activeMembersPromise: Promise.resolve([] as any),
            skillBadgesPromise: Promise.resolve([] as any),
            eventParticipantsPromise: Promise.resolve([] as any),
            eventReservesPromise: Promise.resolve([] as any),
            locationsPromise: Promise.resolve([] as any),
            eventTags: ["Before", "During"],
        },
    };
};

const renderDashboard = async (eventOverrides: Record<string, any> = {}) => {
    const { event, props } = createProps(eventOverrides);
    await act(async () => {
        render(<EventDashboard {...props} />);
    });
    return event;
};

describe("EventDashboard", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: testdata.user,
            language: Language.english,
        } as any);
        vi.mocked(useMediaQuery).mockReturnValue(false);
        vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any);
        vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as any);
        vi.mocked(isUserHost).mockReturnValue(false);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(isEventCancelled).mockReturnValue(false);
        vi.mocked(isEventSoldOut).mockReturnValue(false);
        vi.mocked(isUserParticipant).mockReturnValue(false);
    });

    it("returns null when no user is present in context", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: null,
            language: Language.english,
        } as any);

        await renderDashboard();

        expect(screen.queryByRole("tablist", { name: "event tabs" })).not.toBeInTheDocument();
    });

    it("renders draft status note when event status is draft", async () => {
        await renderDashboard({ status: EventStatus.draft });

        expect(
            screen.getByText("This is an event draft and is only visible to the host"),
        ).toBeInTheDocument();
    });

    it("renders pending approval note when event status is pending_approval", async () => {
        await renderDashboard({ status: EventStatus.pending_approval });

        expect(
            screen.getByText("This event will be visible to members once approved by an admin."),
        ).toBeInTheDocument();
    });

    it("appends cancelled label to title when event is cancelled", async () => {
        vi.mocked(isEventCancelled).mockReturnValue(true);

        await renderDashboard({ status: EventStatus.cancelled });

        expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent('"CANCELLED"');
    });

    it("appends sold out label to title when event is sold out and not cancelled", async () => {
        vi.mocked(isEventSoldOut).mockReturnValue(true);

        await renderDashboard();

        expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("(SOLD OUT)");
    });

    it("builds details, location, organize and tickets tabs for all users", async () => {
        await renderDashboard();

        expect(screen.getByRole("tab", { name: "Details" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Location" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Volunteer" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Tickets" })).toBeInTheDocument();
    });

    it("includes participants tab when user is host", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);

        await renderDashboard();

        expect(screen.getByRole("tab", { name: "Participants" })).toBeInTheDocument();
    });

    it("does not include participants tab for non-host non-admin users", async () => {
        await renderDashboard();

        expect(screen.queryByRole("tab", { name: "Participants" })).not.toBeInTheDocument();
    });

    it("includes reserve list tab when event is sold out and user is not participant", async () => {
        vi.mocked(isEventSoldOut).mockReturnValue(true);
        vi.mocked(isUserParticipant).mockReturnValue(false);

        await renderDashboard();

        expect(screen.getByRole("tab", { name: "Reserve List" })).toBeInTheDocument();
    });

    it("uses details as default tab when search param tab is missing", async () => {
        await renderDashboard();

        expect(screen.getByTestId("event-details")).toBeInTheDocument();
    });

    it("uses tab from search params when a valid tab value is provided", async () => {
        vi.mocked(useSearchParams).mockReturnValue(
            new URLSearchParams(`tab=${encodeURIComponent(implementedTabs.location)}`) as any,
        );

        await renderDashboard();

        expect(screen.getByTestId("location-dashboard")).toBeInTheDocument();
    });

    it("calls clientRedirect with event id and selected tab when tab changes", async () => {
        const mockRouter = { push: vi.fn() };
        vi.mocked(useRouter).mockReturnValue(mockRouter as any);

        const event = await renderDashboard();

        await userEvent.click(screen.getByRole("tab", { name: "Location" }));

        expect(clientRedirect).toHaveBeenCalledWith(mockRouter, [GlobalConstants.CALENDAR_POST], {
            [GlobalConstants.EVENT_ID]: event.id,
            tab: implementedTabs.location,
        });
    });

    it("renders KanBanBoard readOnly true for non-host non-admin users on organize tab", async () => {
        vi.mocked(useSearchParams).mockReturnValue(
            new URLSearchParams(`tab=${encodeURIComponent(implementedTabs.organize)}`) as any,
        );

        await renderDashboard();

        expect(screen.getByTestId("kanban-board")).toHaveTextContent("readonly");
    });

    it("renders KanBanBoard readOnly false for admin users on organize tab", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);
        vi.mocked(useSearchParams).mockReturnValue(
            new URLSearchParams(`tab=${encodeURIComponent(implementedTabs.organize)}`) as any,
        );

        await renderDashboard();

        expect(screen.getByTestId("kanban-board")).toHaveTextContent("editable");
    });

    it("renders TicketDashboard on tickets tab when user is participant and not host", async () => {
        vi.mocked(isUserParticipant).mockReturnValue(true);
        vi.mocked(isUserHost).mockReturnValue(false);
        vi.mocked(useSearchParams).mockReturnValue(
            new URLSearchParams(`tab=${encodeURIComponent(implementedTabs.tickets)}`) as any,
        );

        await renderDashboard();

        expect(screen.getByTestId("ticket-dashboard")).toBeInTheDocument();
        expect(screen.queryByTestId("ticket-shop")).not.toBeInTheDocument();
    });

    it("renders TicketShop and supports goToOrganizeTab callback", async () => {
        const mockRouter = { push: vi.fn() };
        vi.mocked(useRouter).mockReturnValue(mockRouter as any);
        vi.mocked(isUserHost).mockReturnValue(true);
        vi.mocked(useSearchParams).mockReturnValue(
            new URLSearchParams(`tab=${encodeURIComponent(implementedTabs.tickets)}`) as any,
        );

        const event = await renderDashboard();

        expect(screen.getByTestId("ticket-shop")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Go organize" }));
        expect(clientRedirect).toHaveBeenCalledWith(mockRouter, [GlobalConstants.CALENDAR_POST], {
            [GlobalConstants.EVENT_ID]: event.id,
            tab: implementedTabs.organize,
        });
    });

    it("renders content panel inside ErrorBoundarySuspense", async () => {
        await renderDashboard();

        const boundary = screen.getByTestId("error-boundary");
        expect(within(boundary).getByTestId("event-details")).toBeInTheDocument();
    });

    it("renders EventActions and forwards event tags", async () => {
        await renderDashboard();

        expect(screen.getByTestId("event-actions")).toHaveTextContent("Before,During");
    });

    it("uses translated tab labels when language is swedish", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: testdata.user,
            language: Language.swedish,
        } as any);

        await renderDashboard();

        expect(screen.getByRole("tab", { name: "Detaljer" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Plats" })).toBeInTheDocument();
    });

    it("does not include reserve list tab when event is sold out and user is participant", async () => {
        vi.mocked(isEventSoldOut).mockReturnValue(true);
        vi.mocked(isUserParticipant).mockReturnValue(true);

        await renderDashboard();

        expect(screen.queryByRole("tab", { name: "Reserve List" })).not.toBeInTheDocument();
    });

    it("does not include reserve list tab when event is not sold out", async () => {
        vi.mocked(isEventSoldOut).mockReturnValue(false);

        await renderDashboard();

        expect(screen.queryByRole("tab", { name: "Reserve List" })).not.toBeInTheDocument();
    });

    it("renders icon-only tabs on small screens", async () => {
        vi.mocked(useMediaQuery).mockReturnValue(true);

        await renderDashboard();

        expect(screen.queryByRole("tab", { name: "Details" })).not.toBeInTheDocument();
        expect(screen.getAllByRole("tab").length).toBeGreaterThan(0);
    });

    it("falls back to EventDetails when open tab value is unknown", async () => {
        vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("tab=UnknownTab") as any);

        await renderDashboard();

        expect(screen.getByTestId("event-details")).toBeInTheDocument();
    });
});
