import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventActions from "./EventActions";
import testdata from "../../../test/testdata";
import { EventStatus, Language } from "../../../prisma/generated/enums";
import { useUserContext } from "../../context/UserContext";
import NotificationContextProvider from "../../context/NotificationContext";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import {
    cancelEvent,
    cloneEvent,
    deleteEvent,
    getEventParticipants,
    publishEvent,
    updateEvent,
} from "../../lib/event-actions";
import { sendMassEmail } from "../../lib/mail-service/mail-service";
import { isUserAdmin, isUserHost } from "../../lib/utils";
import { allowRedirectException } from "../../ui/utils";
import { pdf } from "@react-pdf/renderer";
import GlobalConstants from "../../GlobalConstants";
import LocalizationContextProvider from "../../context/LocalizationContext";

vi.mock("../../lib/event-actions", () => ({
    cancelEvent: vi.fn(),
    cloneEvent: vi.fn(),
    deleteEvent: vi.fn(),
    getEventParticipants: vi.fn(),
    publishEvent: vi.fn(),
    updateEvent: vi.fn(),
}));

vi.mock("../../context/OrganizationSettingsContext", () => ({
    useOrganizationSettingsContext: vi.fn(() => ({
        organizationSettings: {
            organizationSettings: {
                event_manager_email: null,
            },
        },
    })),
}));

vi.mock("../../lib/mail-service/mail-service", () => ({
    sendMassEmail: vi.fn(),
}));

vi.mock("../../lib/utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        isUserAdmin: vi.fn(() => false),
        isUserHost: vi.fn(() => false),
    };
});

vi.mock("../../ui/utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        allowRedirectException: vi.fn(),
    };
});

vi.mock("@react-pdf/renderer", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        pdf: vi.fn(() => ({
            toBlob: vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
        })),
    };
});

vi.mock("./ParticipantListPDF", () => ({
    __esModule: true,
    default: () => null,
}));

type EventInput = {
    id: string;
    status: EventStatus;
    tickets: { event_participants: { user_id: string }[] }[];
    event_reserves: { user_id: string }[];
    [key: string]: unknown;
};

const buildEvent = (overrides: Partial<EventInput> = {}) => ({
    id: "event-1",
    title: "Workshop",
    status: EventStatus.published,
    tickets: [
        {
            event_participants: [{ user_id: "user-1" }],
        },
    ],
    event_reserves: [{ user_id: "reserve-1" }],
    ...overrides,
});

const buildProps = (eventOverrides: Partial<EventInput> = {}) => ({
    eventPromise: Promise.resolve(buildEvent(eventOverrides) as any),
    locationsPromise: Promise.resolve([
        { id: "loc-1", name: "Hall A" },
        { id: "loc-2", name: "Hall B" },
    ] as any),
    eventTags: ["Before", "During", "After"],
});

const buildCompleteEventOverrides = () => ({
    location_id: "loc-1",
    start_time: new Date("2026-06-01T10:00:00Z"),
    end_time: new Date("2026-06-01T12:00:00Z"),
    max_participants: 10,
    fullTicketPrice: 5000,
    description: "Event description",
    tags: ["Before"],
});

const renderEventActions = async (eventOverrides: Partial<EventInput> = {}) => {
    await act(async () => {
        render(
            <LocalizationContextProvider>
                <NotificationContextProvider>
                    <EventActions {...buildProps(eventOverrides)} />
                </NotificationContextProvider>
            </LocalizationContextProvider>,
        );
    });
};

const openActionMenu = async () => {
    const actionButton = document.querySelector('button[aria-haspopup="true"]') as HTMLElement;
    expect(actionButton).toBeTruthy();
    await userEvent.click(actionButton);
};

const clickConfirmedAction = async (actionLabel: string) => {
    await userEvent.click(screen.getByRole("button", { name: actionLabel }));
    await userEvent.click(await screen.findByRole("button", { name: /Proceed|Fortsätt/ }));
};

describe("EventActions", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: testdata.user,
            language: Language.english,
        } as any);
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: {
                event_manager_email: null,
            },
        } as any);
        vi.mocked(isUserHost).mockReturnValue(false);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(updateEvent).mockResolvedValue(undefined as never);
        vi.mocked(publishEvent).mockResolvedValue(undefined as never);
        vi.mocked(cancelEvent).mockResolvedValue(undefined as never);
        vi.mocked(deleteEvent).mockResolvedValue(undefined as never);
        vi.mocked(cloneEvent).mockResolvedValue(undefined as never);
        vi.mocked(getEventParticipants).mockResolvedValue([] as never);
        vi.mocked(sendMassEmail).mockResolvedValue({ accepted: 1, rejected: 0 } as never);
        vi.mocked(pdf).mockReturnValue({
            toBlob: vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
        } as any);
        Object.defineProperty(URL, "createObjectURL", {
            writable: true,
            value: vi.fn(() => "blob:participant-list"),
        });
        window.open = vi.fn();
    });

    it("shows only clone action for non-host non-admin users", async () => {
        await renderEventActions();
        await openActionMenu();

        expect(screen.getByRole("button", { name: "Clone event" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Edit event" })).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Send mail to participants" }),
        ).not.toBeInTheDocument();
    });

    it("shows host/admin actions and delete when participant count is 1", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);

        await renderEventActions({
            tickets: [{ event_participants: [{ user_id: "only-host" }] }],
        });
        await openActionMenu();

        expect(screen.getByRole("button", { name: "Edit event" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Delete event" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Print participant list" })).toBeInTheDocument();
    });

    it("hides delete action when participant count is greater than 1", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderEventActions({
            tickets: [{ event_participants: [{ user_id: "u1" }, { user_id: "u2" }] }],
        });
        await openActionMenu();

        expect(screen.queryByRole("button", { name: "Delete event" })).not.toBeInTheDocument();
    });

    it("submits draft for approval when org requires approval", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: {
                event_manager_email: "manager@example.com",
            },
        } as any);

        await renderEventActions({ status: EventStatus.draft });
        await openActionMenu();

        await clickConfirmedAction("Submit for approval");

        await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
        const [, formData] = vi.mocked(updateEvent).mock.calls[0];
        expect((formData as FormData).get(GlobalConstants.STATUS)).toBe(
            EventStatus.pending_approval,
        );
        expect(await screen.findByText("Submitted for approval")).toBeInTheDocument();
    });

    it("shows error notification when submit for approval fails", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: {
                event_manager_email: "manager@example.com",
            },
        } as any);
        vi.mocked(updateEvent).mockRejectedValue(new Error("submit failed") as never);

        await renderEventActions({ status: EventStatus.draft });
        await openActionMenu();

        await clickConfirmedAction("Submit for approval");

        expect(await screen.findByText("Failed to submit for approval")).toBeInTheDocument();
    });

    it("publishes draft directly when approval is not required", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);

        await renderEventActions({ status: EventStatus.draft });
        await openActionMenu();

        await clickConfirmedAction("Publish event");

        await waitFor(() => expect(publishEvent).toHaveBeenCalledWith("event-1"));
        expect(await screen.findByText("Published event")).toBeInTheDocument();
    });

    it("shows disabled pending approval status action for non-admin users", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);
        vi.mocked(isUserAdmin).mockReturnValue(false);

        await renderEventActions({ status: EventStatus.pending_approval });
        await openActionMenu();

        const disabledButton = screen
            .getAllByRole("button")
            .find((button) => button.hasAttribute("disabled"));
        expect(disabledButton).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Publish event" })).not.toBeInTheDocument();
    });

    it("cancels published event and shows success notification", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderEventActions({ status: EventStatus.published });
        await openActionMenu();

        await clickConfirmedAction("Cancel event");

        await waitFor(() => expect(cancelEvent).toHaveBeenCalledWith("event-1"));
        expect(
            await screen.findByText("Cancelled event and informed participants"),
        ).toBeInTheDocument();
    });

    it("shows error notification when cancel action fails", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);
        vi.mocked(cancelEvent).mockRejectedValue(new Error("cancel failed") as never);

        await renderEventActions({ status: EventStatus.published });
        await openActionMenu();

        await clickConfirmedAction("Cancel event");

        expect(await screen.findByText("Failed to cancel event")).toBeInTheDocument();
    });

    it("prints participant list by generating a PDF and opening a new tab", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);
        vi.mocked(getEventParticipants).mockResolvedValue([{ user_id: "u1" }] as never);

        await renderEventActions();
        await openActionMenu();

        await userEvent.click(screen.getByRole("button", { name: "Print participant list" }));

        await waitFor(() => expect(getEventParticipants).toHaveBeenCalledWith("event-1"));
        expect(pdf).toHaveBeenCalled();
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(window.open).toHaveBeenCalledWith("blob:participant-list", "_blank");
    });

    it("shows error notification when participant list printing fails", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);
        vi.mocked(getEventParticipants).mockRejectedValue(new Error("failed") as never);

        await renderEventActions();
        await openActionMenu();

        await userEvent.click(screen.getByRole("button", { name: "Print participant list" }));

        expect(await screen.findByText("Failed to print participant list")).toBeInTheDocument();
    });

    it("opens edit dialog with location and tag options", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);

        await renderEventActions();
        await openActionMenu();

        await userEvent.click(screen.getByRole("button", { name: "Edit event" }));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("opens clone dialog", async () => {
        await renderEventActions();
        await openActionMenu();

        await userEvent.click(screen.getByRole("button", { name: "Clone event" }));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("sendout form targets participants by default and can switch to reserves", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderEventActions({
            tickets: [{ event_participants: [{ user_id: "u1" }, { user_id: "u2" }] }],
            event_reserves: [{ user_id: "r1" }],
        });
        await openActionMenu();
        await userEvent.click(screen.getByRole("button", { name: "Send mail to participants" }));

        expect(screen.getByText("Send to 3 recipients.")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("radio", { name: "Reserves" }));
        expect(screen.getByText("Send to 1 recipients.")).toBeInTheDocument();

        await openActionMenu();
        await userEvent.click(screen.getByRole("button", { name: "Send mail to participants" }));
        expect(screen.getByText("Send to 1 recipients.")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("radio", { name: "All" }));
        expect(screen.getByText("Send to 3 recipients.")).toBeInTheDocument();
    });

    it("handles delete failure via redirect exception helper and error notification", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);
        const failure = new Error("delete failed");
        vi.mocked(deleteEvent).mockRejectedValue(failure as never);

        await renderEventActions({ tickets: [{ event_participants: [{ user_id: "only-host" }] }] });
        await openActionMenu();
        await clickConfirmedAction("Delete event");

        await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith("event-1"));
        expect(allowRedirectException).toHaveBeenCalledWith(failure);
        expect(await screen.findByText("Failed to delete")).toBeInTheDocument();
    });

    it("shows publish action for pending_approval when user is admin", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        await renderEventActions({ status: EventStatus.pending_approval });
        await openActionMenu();

        await clickConfirmedAction("Publish event");

        await waitFor(() => expect(publishEvent).toHaveBeenCalledWith("event-1"));
        expect(await screen.findByText("Published event")).toBeInTheDocument();
    });

    it("shows error notification when publish action fails", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);
        vi.mocked(publishEvent).mockRejectedValue(new Error("publish failed") as never);

        await renderEventActions({ status: EventStatus.draft });
        await openActionMenu();

        await clickConfirmedAction("Publish event");

        expect(await screen.findByText("Failed to publish event")).toBeInTheDocument();
    });

    it("shows swedish action labels and notifications when language is swedish", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: testdata.user,
            language: Language.swedish,
        } as any);
        vi.mocked(isUserHost).mockReturnValue(true);
        vi.mocked(publishEvent).mockRejectedValue(new Error("publish failed") as never);

        await renderEventActions({ status: EventStatus.draft });
        await openActionMenu();

        expect(screen.getByRole("button", { name: "Publicera evenemang" })).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Skicka mail till deltagare" }),
        ).toBeInTheDocument();

        await clickConfirmedAction("Publicera evenemang");

        expect(await screen.findByText("Kunde inte publicera evenemang")).toBeInTheDocument();
    });

    it("renders action menu items when menu is open", async () => {
        await renderEventActions();
        await openActionMenu();

        expect(screen.getByRole("button", { name: "Clone event" })).toBeInTheDocument();
    });

    it("submits clone form and calls cloneEvent", async () => {
        await renderEventActions(buildCompleteEventOverrides());
        await openActionMenu();

        await userEvent.click(screen.getByRole("button", { name: "Clone event" }));

        const dialog = screen.getByRole("dialog");
        const form = dialog.querySelector("form");
        expect(form).toBeTruthy();
        fireEvent.submit(form as HTMLFormElement);

        await waitFor(() =>
            expect(cloneEvent).toHaveBeenCalledWith("event-1", expect.any(FormData)),
        );
    });

    it("shows failed save error when edit form submit fails", async () => {
        vi.mocked(isUserHost).mockReturnValue(true);
        vi.mocked(updateEvent).mockRejectedValue(new Error("update failed") as never);

        await renderEventActions(buildCompleteEventOverrides());
        await openActionMenu();
        await userEvent.click(screen.getByRole("button", { name: "Edit event" }));

        const dialog = screen.getByRole("dialog");
        await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));

        await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
        expect(await screen.findByText("Failed to save")).toBeInTheDocument();
    });

    it("shows failed send mail error when sendout form submit fails", async () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);
        vi.mocked(sendMassEmail).mockRejectedValue(new Error("sendout failed") as never);

        await renderEventActions({
            ...buildCompleteEventOverrides(),
            subject: "Hello",
            content: "Body",
        } as any);
        await openActionMenu();
        await userEvent.click(screen.getByRole("button", { name: "Send mail to participants" }));

        const dialog = screen.getByRole("dialog");
        await userEvent.click(within(dialog).getByRole("button", { name: "Send" }));

        expect(await screen.findByText("Failed to send mail")).toBeInTheDocument();
    });
});
