import { act, render, screen } from "@testing-library/react";
import TicketDashboard from "./TicketDashboard";
import { EventStatus, Language, TicketType, UserRole } from "../../../prisma/generated/enums";
import dayjs from "../../lib/dayjs";
import { formatDate } from "../../ui/utils";
import { checkInEventParticipant } from "../../lib/event-participant-actions";
import { useUserContext } from "../../context/UserContext";
import testdata from "../../../test/testdata";

vi.mock("../../lib/event-participant-actions", () => ({
    checkInEventParticipant: vi.fn(),
}));
const baseUser = {
    id: "user1",
    nickname: "TestUser",
    user_membership: {
        expires_at: dayjs().add(1, "month").toDate(),
    },
};

const baseEvent = {
    id: "event1",
    status: EventStatus.published,
    title: "Test Event",
    location_id: null,
    start_time: dayjs().toDate(),
    end_time: dayjs().add(4, "hour").toDate(),
    description: null,
    max_participants: 100,
    tags: [],
    host_id: null,
    tasks: [],
};
const baseTicket = {
    id: "ticket1",
    type: TicketType.standard,
    product_id: "product1",
    event_id: baseEvent.id,
    event: baseEvent,
};

function getEventParticipant(overrides = {}) {
    return {
        id: "ep1",
        ticket_id: baseTicket.id,
        ticket: baseTicket,
        user_id: baseUser.id,
        user: baseUser,
        checked_in_at: null,
        ...overrides,
    };
}

const renderWithNotificationContext = async (eventParticipant: any) => {
    return await act(async () => render(<TicketDashboard eventParticipant={eventParticipant} />));
};

describe("TicketDashboard", () => {
    it("renders ticket and event details correctly when outside the event opening hours", async () => {
        const mockEvent = { ...baseEvent, start_time: dayjs().add(2, "hour").toDate() };
        const eventParticipant = getEventParticipant({
            ticket: { ...baseTicket, event: mockEvent },
        });

        await renderWithNotificationContext(eventParticipant);

        expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
        expect(
            screen.getByText(new RegExp(`Ticket type: ${baseTicket.type}`, "i")),
        ).toBeInTheDocument();
        expect(
            screen.getByText(new RegExp(`Belongs to: ${baseUser.nickname}`, "i")),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                `${formatDate(dayjs(eventParticipant.ticket.event.start_time))} - ${formatDate(dayjs(eventParticipant.ticket.event.end_time))}`,
            ),
        ).toBeInTheDocument();
        // Should not check in the participant if outside the event opening hours
        expect(vi.mocked(checkInEventParticipant)).not.toHaveBeenCalled();
        // Should show yellow status
        expect(screen.getByText("Valid")).toBeInTheDocument();
        expect(screen.getByText(/not ongoing/i)).toBeInTheDocument();
    });

    it("checks in the participant and shows green status if within event window", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { ...baseUser, role: UserRole.admin },
            language: Language.english,
        } as any);
        vi.mocked(checkInEventParticipant).mockResolvedValue(undefined);
        const eventParticipant = getEventParticipant();

        await renderWithNotificationContext(eventParticipant);

        expect(vi.mocked(checkInEventParticipant)).toHaveBeenCalled();
        expect(screen.getByText("Valid")).toBeInTheDocument();
        expect(screen.getByText(/check-in succeeded/i)).toBeInTheDocument();
    });

    it("shows yellow status and error if check-in fails", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { ...baseUser, role: UserRole.admin },
            language: Language.english,
        } as any);
        vi.mocked(checkInEventParticipant).mockResolvedValue("Server error");
        const eventParticipant = getEventParticipant();

        await renderWithNotificationContext(eventParticipant);

        expect(vi.mocked(checkInEventParticipant)).toHaveBeenCalled();
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
        expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    it("shows red status if already checked in (checked_in_at > 10s ago)", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { ...baseUser, role: UserRole.admin },
            language: Language.english,
        } as any);
        const checkedInAt = dayjs().subtract(30, "second").toDate();
        const eventParticipant = getEventParticipant({ checked_in_at: checkedInAt });

        await renderWithNotificationContext(eventParticipant);

        expect(vi.mocked(checkInEventParticipant)).not.toHaveBeenCalled();
        expect(screen.getByText("Checked in")).toBeInTheDocument();
        expect(screen.getByText(/already checked in/i)).toBeInTheDocument();
    });

    it("shows no ticket found message if event participant is null", async () => {
        await renderWithNotificationContext(null);

        expect(screen.getByText(/ticket not found/i)).toBeInTheDocument();
        expect(screen.getByText(/missing data/i)).toBeInTheDocument();
    });

    it("handles missing event or user details gracefully", async () => {
        const eventParticipant = getEventParticipant({ user: undefined });

        await renderWithNotificationContext(eventParticipant);

        expect(screen.getByText(/missing data/i)).toBeInTheDocument();
        expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it("displays translated text content based on user language", async () => {
        // This test assumes LanguageTranslations is mocked or set to a specific language
        vi.mocked(useUserContext).mockReturnValue({
            user: testdata.user,
            language: Language.swedish,
        } as any);
        const eventParticipant = getEventParticipant();

        await renderWithNotificationContext(eventParticipant);

        expect(screen.getByText(/giltig biljett/i)).toBeInTheDocument();
    });

    it("retries check-in if it fails due to a transient error", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { ...baseUser, role: UserRole.admin },
            language: Language.english,
        } as any);
        // Simulate transient error by failing first, then succeeding
        let callCount = 0;
        vi.mocked(checkInEventParticipant).mockImplementation(async () => {
            callCount++;
            if (callCount === 1) throw new Error("Transient error");
            return undefined;
        });
        const eventParticipant = getEventParticipant();
        await renderWithNotificationContext(eventParticipant);
        expect(vi.mocked(checkInEventParticipant)).toHaveBeenCalled();
        // Should eventually show valid/green status
        expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    it("handles unexpected errors during check-in gracefully", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { ...baseUser, role: UserRole.admin },
            language: Language.english,
        } as any);
        vi.mocked(checkInEventParticipant).mockImplementation(() => {
            throw new Error("Unexpected");
        });
        const eventParticipant = getEventParticipant();
        await renderWithNotificationContext(eventParticipant);
        expect(await screen.findByText(/check-in failed/i)).toBeInTheDocument();
        expect(screen.getByText("Valid")).toBeInTheDocument();
    });
});
