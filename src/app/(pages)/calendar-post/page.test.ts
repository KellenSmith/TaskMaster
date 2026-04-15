import dayjs from "../../lib/dayjs";
import { EventStatus, UserRole } from "../../../prisma/generated/enums";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-helpers";
import EventPage from "./page";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";

const mockUser = {
    id: "user-1",
    role: UserRole.member,
    user_membership: {
        expires_at: dayjs().add(1, "month").toDate(),
    },
};
const activeMembers = [
    {
        id: "user-2",
        nickname: "User 2",
    },
];

vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
    getActiveMembers: vi.fn(),
}));

const mockSearchParams = Promise.resolve({ [GlobalConstants.EVENT_ID]: "event-1" });
const mockEvent = {
    id: "event-1",
    status: EventStatus.draft,
    host_id: "host-1",
    tags: ["tag1", "tag2"],
};
const mockedTasks = [
    {
        id: "task-1",
    },
];
const mockedTickets = [
    {
        id: "ticket-1",
    },
];
const mockSkillBadges = [
    {
        id: "skill-badge-1",
    },
];
const mockEventParticipants = [
    {
        id: "event-participant-1",
        user: {
            id: "user-3",
            nickname: "User 3",
        },
    },
];
const mockEventReserves = [
    {
        id: "event-reserve-1",
    },
];
const mockLocations = [
    {
        id: "location-1",
    },
];

// [eventStatus, userRole, eventHost]
const authorizedTestCases = [
    [EventStatus.published, UserRole.member, false],
    [EventStatus.draft, UserRole.member, true],
    [EventStatus.draft, UserRole.admin, false],
    [EventStatus.draft, UserRole.admin, true],
];

describe("EventPage", () => {
    beforeEach(() => {
        vi.mocked(getLoggedInUser).mockResolvedValue(mockUser as any);
        vi.mocked(getActiveMembers).mockResolvedValue(activeMembers as any);
        vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue(mockEvent as any);
        vi.mocked(prisma.task.findMany).mockResolvedValue(mockedTasks as any);
        vi.mocked(prisma.ticket.findMany).mockResolvedValue(mockedTickets as any);
    });

    it("throws an error if the user is not logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
        await expect(
            async () => await EventPage({ searchParams: mockSearchParams }),
        ).rejects.toThrow("Unauthorized");
        expect(prisma.event.findUniqueOrThrow).not.toHaveBeenCalled();
        expect(prisma.task.findMany).not.toHaveBeenCalled();
        expect(prisma.ticket.findMany).not.toHaveBeenCalled();
        expect(getActiveMembers).not.toHaveBeenCalled();
    });
    it("throws an error if the user is not authorized to view the event", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(mockUser as any);
        vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue({
            id: "event-1",
            status: EventStatus.draft,
            host_id: "host-1",
        } as any);
        await expect(
            async () => await EventPage({ searchParams: mockSearchParams }),
        ).rejects.toThrow("Unauthorized");
        expect(prisma.event.findUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: "event-1" },
            include: {
                location: true,
                tickets: {
                    include: {
                        event_participants: true,
                    },
                },
                event_reserves: true,
            },
        });
        expect(prisma.task.findMany).not.toHaveBeenCalled();
        expect(prisma.ticket.findMany).not.toHaveBeenCalled();
        expect(getActiveMembers).not.toHaveBeenCalled();
    });
    it.for(authorizedTestCases)(
        "shows the event when event is %s, user is %s, user is host: %s",
        async ([eventStatus, userRole, eventHost]) => {
            vi.mocked(getLoggedInUser).mockResolvedValue({
                ...mockUser,
                role: userRole,
            } as any);
            const mockPublishedEvent = {
                ...mockEvent,
                status: eventStatus,
                host_id: eventHost ? mockUser.id : "host-1",
            };
            vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue(mockPublishedEvent as any);
            vi.mocked(prisma.task.findMany).mockResolvedValue(mockedTasks as any);
            vi.mocked(prisma.ticket.findMany).mockResolvedValue(mockedTickets as any);
            vi.mocked(getActiveMembers).mockResolvedValue(activeMembers as any);
            vi.mocked(prisma.skillBadge.findMany).mockResolvedValue(mockSkillBadges as any);
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue(
                mockEventParticipants as any,
            );
            vi.mocked(prisma.eventReserve.findMany).mockResolvedValue(mockEventReserves as any);
            vi.mocked(prisma.location.findMany).mockResolvedValue(mockLocations as any);
            vi.mocked(prisma.event.findMany).mockResolvedValue([mockPublishedEvent as any]);

            const result = await EventPage({ searchParams: mockSearchParams });

            expect(prisma.event.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: "event-1" },
                include: {
                    location: true,
                    tickets: {
                        include: {
                            event_participants: true,
                        },
                    },
                    event_reserves: true,
                },
            });
            expect(prisma.task.findMany).toHaveBeenCalledWith({
                where: { event_id: "event-1" },
                include: {
                    assignee: {
                        select: {
                            id: true,
                            nickname: true,
                        },
                    },
                    skill_badges: true,
                },
            });
            expect(prisma.ticket.findMany).toHaveBeenCalledWith({
                where: {
                    event_id: "event-1",
                },
                include: {
                    product: true,
                    event_participants: true,
                },
            });
            expect(getActiveMembers).toHaveBeenCalled();
            expect(result.props).toStrictEqual({
                eventPromise: Promise.resolve(mockPublishedEvent),
                eventTasksPromise: Promise.resolve(mockedTasks),
                eventTicketsPromise: Promise.resolve(mockedTickets),
                activeMembersPromise: Promise.resolve(activeMembers),
                skillBadgesPromise: Promise.resolve(mockSkillBadges),
                eventParticipantsPromise: Promise.resolve(mockEventParticipants),
                eventReservesPromise: Promise.resolve(mockEventReserves),
                locationsPromise: Promise.resolve(mockLocations),
                eventTags: mockPublishedEvent.tags,
            });
        },
    );
});
