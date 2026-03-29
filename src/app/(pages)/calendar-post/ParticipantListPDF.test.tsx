import { render, screen } from "@testing-library/react";
import ParticipantListPDF from "./ParticipantListPDF";
import { Language } from "../../../prisma/generated/enums";
import dayjs from "dayjs";

// Mock @react-pdf/renderer components to render as simple HTML elements since react-pdf uses its own rendering system that doesn't work in a JSDOM environment.
// This allows us to test the content structure without needing to render an actual PDF.
vi.mock("@react-pdf/renderer", () => ({
    Document: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="pdf-document">{children}</div>
    ),
    Page: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    StyleSheet: {
        create: (styleObject: Record<string, unknown>) => styleObject,
    },
}));

type EventLike = {
    title: string;
    start_time: string;
    end_time: string;
};

type EventParticipantLike = {
    user: {
        id: string;
        nickname: string;
    };
};

const baseEvent: EventLike = {
    title: "Cleanup Day",
    start_time: dayjs("2026/03/10 09:00").toISOString(),
    end_time: dayjs("2026/03/10 11:00").toISOString(),
};

const baseParticipants: EventParticipantLike[] = [
    { user: { id: "user-1", nickname: "Alice" } },
    { user: { id: "user-2", nickname: "Bob" } },
];

const renderParticipantListPDF = (
    overrides: Partial<EventLike> = {},
    eventParticipants: EventParticipantLike[] = baseParticipants,
    language: Language = Language.english,
) => {
    const event = { ...baseEvent, ...overrides };
    return render(
        <ParticipantListPDF
            event={event as any}
            eventParticipants={eventParticipants as any}
            language={language}
        />,
    );
};

describe("ParticipantListPDF", () => {
    it("renders document root and english title", () => {
        renderParticipantListPDF();

        expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
        expect(screen.getByText("Participant List")).toBeInTheDocument();
    });

    it("renders printed label and event detail labels", () => {
        renderParticipantListPDF();

        expect(screen.getByText("Printed")).toBeInTheDocument();
        expect(screen.getByText("Event:")).toBeInTheDocument();
        expect(screen.getByText("Time:")).toBeInTheDocument();
        expect(screen.getByText("Cleanup Day")).toBeInTheDocument();
    });

    it("renders formatted event time interval", () => {
        renderParticipantListPDF();

        expect(screen.getByText(`2026/03/10 09:00 - 2026/03/10 11:00`)).toBeInTheDocument();
    });

    it("renders english table headers", () => {
        renderParticipantListPDF();

        expect(screen.getByText("Nickname")).toBeInTheDocument();
        expect(screen.getByText("Arrived")).toBeInTheDocument();
    });

    it("renders participant rows with nicknames", () => {
        renderParticipantListPDF();

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("does not render participant rows when participant list is empty", () => {
        renderParticipantListPDF({}, [], Language.english);

        expect(screen.queryByText("Alice")).not.toBeInTheDocument();
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
        expect(screen.getByText("Nickname")).toBeInTheDocument();
        expect(screen.getByText("Arrived")).toBeInTheDocument();
    });

    it("renders swedish title and headers", () => {
        renderParticipantListPDF({}, baseParticipants, Language.swedish);

        expect(screen.getByText("Deltagarlista")).toBeInTheDocument();
        expect(screen.getByText("Utskriven")).toBeInTheDocument();
        expect(screen.getByText("Smeknamn")).toBeInTheDocument();
        expect(screen.getByText("Anlänt")).toBeInTheDocument();
    });
});
