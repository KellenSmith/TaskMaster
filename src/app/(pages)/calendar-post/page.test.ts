import dayjs from "dayjs";
import { EventStatus, UserRole } from "../../../prisma/generated/enums";
import { Prisma } from "../../../prisma/generated/browser";
import { getCachedActiveMembers, getLoggedInUser } from "../../lib/user-helpers";
import EventPage from "./page";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";

const mockUser = {
    id: "user-1",
    role: UserRole.member,
    user_membership: {
        expires_at: dayjs.utc().add(1, "month").toDate(),
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
    getCachedActiveMembers: vi.fn(),
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

type EventPromiseType = Promise<
    Prisma.EventGetPayload<{
        include: {
            location: true;
            tickets: { include: { event_participants: true } };
            event_reserves: true;
        };
    }>
>;

type EventTasksPromiseType = Promise<
    Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
    }>[]
>;

type EventTicketsPromiseType = Promise<
    Prisma.TicketGetPayload<{
        include: { product: true; event_participants: true };
    }>[]
>;

type ActiveMembersPromiseType = Promise<
    Prisma.UserGetPayload<{
        select: { id: true; nickname: true; skill_badges: true };
    }>[]
>;

type SkillBadgesPromiseType = Promise<Prisma.SkillBadgeGetPayload<true>[]>;

type EventParticipantsPromiseType = Promise<
    Prisma.EventParticipantGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[]
>;

type EventReservesPromiseType = Promise<
    Prisma.EventReserveGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[]
>;

type LocationsPromiseType = Promise<Prisma.LocationGetPayload<true>[]>;
type EventTagsPromiseType = Promise<string[]>;

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
        vi.mocked(getCachedActiveMembers).mockResolvedValue(activeMembers as any);
        vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue(mockEvent as any);
        vi.mocked(prisma.task.findMany).mockResolvedValue(mockedTasks as any);
        vi.mocked(prisma.ticket.findMany).mockResolvedValue(mockedTickets as any);
    });

    it("throws an error if the user is not logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
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
        expect(getCachedActiveMembers).not.toHaveBeenCalled();
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
        expect(getCachedActiveMembers).not.toHaveBeenCalled();
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
            vi.mocked(getCachedActiveMembers).mockResolvedValue(activeMembers as any);
            vi.mocked(prisma.skillBadge.findMany).mockResolvedValue(mockSkillBadges as any);
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue(
                mockEventParticipants as any,
            );
            vi.mocked(prisma.eventReserve.findMany).mockResolvedValue(mockEventReserves as any);
            vi.mocked(prisma.location.findMany).mockResolvedValue(mockLocations as any);
            vi.mocked(prisma.event.findMany).mockResolvedValue([mockPublishedEvent as any]);

            const result = await EventPage({ searchParams: mockSearchParams });
            const props = result.props as {
                eventPromise: EventPromiseType;
                eventTasksPromise: EventTasksPromiseType;
                eventTicketsPromise: EventTicketsPromiseType;
                activeMembersPromise: ActiveMembersPromiseType;
                skillBadgesPromise: SkillBadgesPromiseType;
                eventParticipantsPromise: EventParticipantsPromiseType;
                eventReservesPromise: EventReservesPromiseType;
                locationsPromise: LocationsPromiseType;
                eventTagsPromise: EventTagsPromiseType;
            };

            const [
                resolvedEvent,
                resolvedEventTasks,
                resolvedEventTickets,
                resolvedActiveMembers,
                resolvedSkillBadges,
                resolvedEventParticipants,
                resolvedEventReserves,
                resolvedLocations,
                resolvedEventTags,
            ] = await Promise.all([
                props.eventPromise,
                props.eventTasksPromise,
                props.eventTicketsPromise,
                props.activeMembersPromise,
                props.skillBadgesPromise,
                props.eventParticipantsPromise,
                props.eventReservesPromise,
                props.locationsPromise,
                props.eventTagsPromise,
            ]);

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
            expect(getCachedActiveMembers).toHaveBeenCalled();
            expect(resolvedEvent).toStrictEqual(mockPublishedEvent);
            expect(resolvedEventTasks).toStrictEqual(mockedTasks);
            expect(resolvedEventTickets).toStrictEqual(mockedTickets);
            expect(resolvedActiveMembers).toStrictEqual(activeMembers);
            expect(resolvedSkillBadges).toStrictEqual(mockSkillBadges);
            expect(resolvedEventParticipants).toStrictEqual(mockEventParticipants);
            expect(resolvedEventReserves).toStrictEqual(mockEventReserves);
            expect(resolvedLocations).toStrictEqual(mockLocations);
            expect(resolvedEventTags).toStrictEqual(mockPublishedEvent.tags);
        },
    );
});
