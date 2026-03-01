import { describe, it, expect, vi } from "vitest";
import TicketPage from "./page";
import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import { UserRole } from "../../../prisma/generated/enums";
import dayjs from "dayjs";

// Mock child component to not have to call contexts and other dependencies
vi.mock("./TicketDashboard", () => ({
    default: () => <div data-testid="ticket-dashboard" />,
}));
vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

const mockSearchParams = Promise.resolve({ eventParticipantId: "ep-1" });
const mockUser = {
    id: "user-1",
    role: UserRole.member,
    user_membership: {
        expires_at: dayjs().add(1, "day").toDate(), // Not expired
    },
};
const mockEventParticipant = {
    id: "ep-1",
    ticket: { event: { title: "Event 1", tasks: [] } },
    user_id: "user-1",
};

// [userRole, eventHost, eventVolunteer, eventParticipant]
const authorizedTestCases = [
    [UserRole.admin, false, false, false],
    [UserRole.admin, true, false, false],
    [UserRole.admin, true, true, false],
    [UserRole.member, true, false, false],
    [UserRole.member, true, true, false],
    [UserRole.member, false, true, false],
    [UserRole.member, false, false, true],
];

describe("TicketPage", () => {
    it("throws error if user is not logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);

        await expect(TicketPage({ searchParams: mockSearchParams })).rejects.toThrow(
            "Unauthorized",
        );
        expect(prisma.eventParticipant.findUnique).not.toHaveBeenCalled();
    });
    it("throws error if user is not authorized", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ ...mockUser, id: "user-2" } as any);
        vi.mocked(prisma.eventParticipant.findUnique).mockResolvedValue(
            mockEventParticipant as any,
        );

        await expect(TicketPage({ searchParams: mockSearchParams })).rejects.toThrow(
            "Unauthorized",
        );
        expect(prisma.eventParticipant.findUnique).toHaveBeenCalled();
    });

    it.for(authorizedTestCases)(
        "allows viewing ticket when user role is %s, event host: %s, event volunteer: %s, event participant: %s",
        async ([userRole, eventHost, eventVolunteer, eventParticipant]) => {
            const mockedUserWithRole = {
                ...mockUser,
                role: userRole,
            };
            vi.mocked(getLoggedInUser).mockResolvedValue(mockedUserWithRole as any);
            const mockEventParticipantWithConditions = {
                id: "ep-1",
                ticket: {
                    event: {
                        title: "Event 1",
                        host_id: eventHost ? "user-1" : "other-host",
                        tasks: eventVolunteer ? [{ id: "task-1" }] : [],
                    },
                },
                user_id: eventParticipant ? mockedUserWithRole.id : "other-user",
            };
            vi.mocked(prisma.eventParticipant.findUnique).mockResolvedValue(
                mockEventParticipantWithConditions as any,
            );

            const result = await TicketPage({ searchParams: mockSearchParams });

            // Should call prisma with correct parameters
            expect(prisma.eventParticipant.findUnique).toHaveBeenCalledWith({
                where: { id: "ep-1" },
                include: {
                    ticket: {
                        include: {
                            event: {
                                include: {
                                    tasks: {
                                        where: { assignee_id: mockedUserWithRole.id },
                                        select: { id: true },
                                    },
                                },
                            },
                        },
                    },
                    user: { select: { id: true, nickname: true } },
                },
            });
            // passes the ticketInfoPromise to Dashboard
            expect(result.props.eventParticipant).toStrictEqual(mockEventParticipantWithConditions);
        },
    );

    it("renders dashboard even if eventParticipant is not found", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(mockUser as any);
        vi.mocked(prisma.eventParticipant.findUnique).mockResolvedValue(null);

        const result = await TicketPage({ searchParams: mockSearchParams });

        // passes the ticketInfoPromise to Dashboard
        expect(result.props.eventParticipant).toBe(null);
    });
});
