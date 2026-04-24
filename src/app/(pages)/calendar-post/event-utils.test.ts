import dayjs from "../../lib/dayjs";
import { EventStatus } from "../../../prisma/generated/enums";
import {
    doDateRangesOverlap,
    getEarliestEndTime,
    getEarliestStartTime,
    getEventParticipantCount,
    getGroupedAndSortedTasks,
    getSortedEvents,
    getTasksSortedByTime,
    isEventCancelled,
    isEventPublished,
    isEventSoldOut,
    isTaskSelected,
    isUserParticipant,
    isUserReserve,
    isUserVolunteer,
    sortTasks,
} from "./event-utils";

const makeTask = (
    id: string,
    name: string,
    startIso: string,
    endIso: string,
    assigneeId?: string | null,
) => ({
    id,
    name,
    start_time: dayjs(startIso).toDate(),
    end_time: dayjs(endIso).toDate(),
    assignee_id: assigneeId ?? null,
});

const makeEventWithTickets = (
    status: EventStatus,
    maxParticipants: number,
    participantUserIdsByTicket: string[][],
) => ({
    id: "event-1",
    title: "Event",
    status,
    max_participants: maxParticipants,
    tickets: participantUserIdsByTicket.map((userIds, index) => ({
        id: `ticket-${index + 1}`,
        event_participants: userIds.map((userId) => ({ user_id: userId })),
    })),
    event_reserves: [],
});

describe("event-utils", () => {
    describe("isEventPublished", () => {
        it("returns true for published events", () => {
            expect(isEventPublished({ status: EventStatus.published } as any)).toBe(true);
        });

        it("returns false for non-published events", () => {
            expect(isEventPublished({ status: EventStatus.draft } as any)).toBe(false);
        });
    });

    describe("isUserParticipant", () => {
        it("returns true when user is found in any ticket participant list", () => {
            const user = { id: "user-2" };
            const event = makeEventWithTickets(EventStatus.published, 10, [["user-1"], ["user-2"]]);

            expect(isUserParticipant(user as any, event as any)).toBe(true);
        });

        it("returns false when user is not in any participant list", () => {
            const user = { id: "user-9" };
            const event = makeEventWithTickets(EventStatus.published, 10, [["user-1"], ["user-2"]]);

            expect(isUserParticipant(user as any, event as any)).toBe(false);
        });

        it("returns false when user is null", () => {
            const event = makeEventWithTickets(EventStatus.published, 10, [["user-1"]]);

            expect(isUserParticipant(null, event as any)).toBe(false);
        });

        it("returns false when tickets are missing", () => {
            const user = { id: "user-1" };

            expect(isUserParticipant(user as any, { tickets: undefined } as any)).toBe(false);
        });
    });

    describe("isUserReserve", () => {
        it("returns true when user is present in reserve list", () => {
            const event = { event_reserves: [{ user_id: "user-1" }, { user_id: "user-2" }] };

            expect(isUserReserve({ id: "user-2" } as any, event as any)).toBe(true);
        });

        it("returns false when user is absent from reserve list", () => {
            const event = { event_reserves: [{ user_id: "user-1" }] };

            expect(isUserReserve({ id: "user-9" } as any, event as any)).toBe(false);
        });

        it("returns false when user is null or reserves are missing", () => {
            expect(isUserReserve(null, { event_reserves: [{ user_id: "user-1" }] } as any)).toBe(
                false,
            );
            expect(
                isUserReserve({ id: "user-1" } as any, { event_reserves: undefined } as any),
            ).toBe(false);
        });
    });

    describe("isUserVolunteer", () => {
        it("returns true when user is assigned to any task", () => {
            const tasks = [
                makeTask("1", "A", "2026-01-01T10:00:00", "2026-01-01T11:00:00", "user-2"),
            ];

            expect(isUserVolunteer({ id: "user-2" } as any, tasks as any)).toBe(true);
        });

        it("returns false when user is not assigned or user is null", () => {
            const tasks = [
                makeTask("1", "A", "2026-01-01T10:00:00", "2026-01-01T11:00:00", "user-2"),
            ];

            expect(isUserVolunteer({ id: "user-1" } as any, tasks as any)).toBe(false);
            expect(isUserVolunteer(null, tasks as any)).toBe(false);
        });
    });

    describe("isTaskSelected", () => {
        it("returns true when task id exists in selected tasks", () => {
            const task = { id: "task-1" };
            const selected = [{ id: "task-0" }, { id: "task-1" }];

            expect(isTaskSelected(task as any, selected as any)).toBe(true);
        });

        it("returns false when task id is not selected", () => {
            const task = { id: "task-2" };
            const selected = [{ id: "task-0" }, { id: "task-1" }];

            expect(isTaskSelected(task as any, selected as any)).toBe(false);
        });
    });

    describe("getEarliestStartTime/getEarliestEndTime", () => {
        it("returns earliest start and end times across tasks", () => {
            const tasks = [
                makeTask("1", "A", "2026-02-01T12:00:00", "2026-02-01T16:00:00"),
                makeTask("2", "B", "2026-02-01T09:00:00", "2026-02-01T18:00:00"),
                makeTask("3", "C", "2026-02-01T10:00:00", "2026-02-01T11:00:00"),
            ];

            const earliestStart = getEarliestStartTime(tasks as any);
            const earliestEnd = getEarliestEndTime(tasks as any);

            expect(earliestStart).not.toBeNull();
            expect(earliestEnd).not.toBeNull();
            expect(earliestStart).toStrictEqual(dayjs("2026-02-01T09:00:00.000").toDate());
            expect(earliestEnd).toStrictEqual(dayjs("2026-02-01T11:00:00.000").toDate());
        });
    });

    describe("sortTasks", () => {
        it("sorts by start time when start-time difference is more than one minute", () => {
            const earlier = makeTask("1", "A", "2026-01-01T10:00:00", "2026-01-01T12:00:00");
            const later = makeTask("2", "B", "2026-01-01T10:03:00", "2026-01-01T11:00:00");

            expect(sortTasks(earlier as any, later as any)).toBeLessThan(0);
            expect(sortTasks(later as any, earlier as any)).toBeGreaterThan(0);
        });

        it("falls back to end time when starts are within one minute", () => {
            const earlierEnd = makeTask("1", "A", "2026-01-01T10:00:00", "2026-01-01T10:30:00");
            const laterEnd = makeTask("2", "B", "2026-01-01T10:00:30", "2026-01-01T10:45:00");

            expect(sortTasks(earlierEnd as any, laterEnd as any)).toBeLessThan(0);
        });

        it("falls back to name when start/end are within one minute", () => {
            const alpha = makeTask("1", "Alpha", "2026-01-01T10:00:00", "2026-01-01T10:30:00");
            const beta = makeTask("2", "Beta", "2026-01-01T10:00:30", "2026-01-01T10:30:30");

            expect(sortTasks(alpha as any, beta as any)).toBeLessThan(0);
        });
    });

    describe("getTasksSortedByTime", () => {
        it("sorts by start time, then end time, then name", () => {
            const tasks = [
                makeTask("3", "Bravo", "2026-01-01T10:00:00", "2026-01-01T11:00:00"),
                makeTask("2", "Alpha", "2026-01-01T10:00:00", "2026-01-01T10:30:00"),
                makeTask("1", "Zulu", "2026-01-01T09:00:00", "2026-01-01T09:30:00"),
            ];

            const sorted = getTasksSortedByTime(tasks as any);

            expect(sorted.map((task) => task.id)).toEqual(["1", "2", "3"]);
        });

        it("sorts the provided array in place", () => {
            const tasks = [
                makeTask("2", "Beta", "2026-01-01T10:00:00", "2026-01-01T11:00:00"),
                makeTask("1", "Alpha", "2026-01-01T09:00:00", "2026-01-01T10:00:00"),
            ];

            const originalReference = tasks;
            const sorted = getTasksSortedByTime(tasks as any);

            expect(sorted).toBe(originalReference);
            expect(tasks.map((task) => task.id)).toEqual(["1", "2"]);
        });
    });

    describe("getGroupedAndSortedTasks", () => {
        it("groups by task name and sorts groups by earliest task timing", () => {
            const tasks = [
                makeTask("1", "Setup", "2026-01-01T12:00:00", "2026-01-01T13:00:00"),
                makeTask("2", "Cleanup", "2026-01-01T10:00:00", "2026-01-01T11:00:00"),
                makeTask("3", "Setup", "2026-01-01T09:00:00", "2026-01-01T09:30:00"),
            ];

            const grouped = getGroupedAndSortedTasks(tasks as any);

            expect(grouped).toHaveLength(2);
            expect(grouped[0][0].name).toBe("Setup");
            expect(grouped[0].map((task) => task.id)).toEqual(["3", "1"]);
            expect(grouped[1][0].name).toBe("Cleanup");
        });
    });

    describe("getSortedEvents", () => {
        it("sorts events by start time and uses title as tie-breaker", () => {
            const events = [
                { id: "2", title: "Beta", start_time: dayjs("2026-03-01T09:00:00").toDate() },
                { id: "3", title: "Alpha", start_time: dayjs("2026-03-01T09:00:00").toDate() },
                { id: "1", title: "Gamma", start_time: dayjs("2026-02-01T09:00:00").toDate() },
            ];

            const sorted = getSortedEvents(events as any);

            expect(sorted.map((event) => event.id)).toEqual(["1", "3", "2"]);
        });
    });

    describe("getEventParticipantCount/isEventSoldOut", () => {
        it("counts participants across all tickets", () => {
            const event = makeEventWithTickets(EventStatus.published, 10, [["u1", "u2"], ["u3"]]);

            expect(getEventParticipantCount(event as any)).toBe(3);
        });

        it("returns true when participant count equals max participants", () => {
            const event = makeEventWithTickets(EventStatus.published, 3, [["u1", "u2"], ["u3"]]);

            expect(isEventSoldOut(event as any)).toBe(true);
        });

        it("returns true when participant count exceeds max participants", () => {
            const event = makeEventWithTickets(EventStatus.published, 2, [["u1", "u2"], ["u3"]]);

            expect(isEventSoldOut(event as any)).toBe(true);
        });

        it("returns false when participant count is below max participants", () => {
            const event = makeEventWithTickets(EventStatus.published, 4, [["u1", "u2"], ["u3"]]);

            expect(isEventSoldOut(event as any)).toBe(false);
        });
    });

    describe("isEventCancelled", () => {
        it("returns true for cancelled events", () => {
            expect(isEventCancelled({ status: EventStatus.cancelled } as any)).toBe(true);
        });

        it("returns false for non-cancelled events", () => {
            expect(isEventCancelled({ status: EventStatus.published } as any)).toBe(false);
        });
    });

    describe("doDateRangesOverlap", () => {
        it("returns true when ranges overlap", () => {
            const start1 = dayjs("2026-04-01T10:00:00").toDate();
            const end1 = dayjs("2026-04-01T12:00:00").toDate();
            const start2 = dayjs("2026-04-01T11:00:00").toDate();
            const end2 = dayjs("2026-04-01T13:00:00").toDate();

            expect(doDateRangesOverlap(start1, end1, start2, end2)).toBe(true);
        });

        it("returns false when ranges only touch at boundary", () => {
            const start1 = dayjs("2026-04-01T10:00:00").toDate();
            const end1 = dayjs("2026-04-01T12:00:00").toDate();
            const start2 = dayjs("2026-04-01T12:00:00").toDate();
            const end2 = dayjs("2026-04-01T13:00:00").toDate();

            expect(doDateRangesOverlap(start1, end1, start2, end2)).toBe(false);
        });

        it("returns false when one or more inputs are missing", () => {
            const start = dayjs("2026-04-01T10:00:00").toDate();
            const end = dayjs("2026-04-01T12:00:00").toDate();

            expect(doDateRangesOverlap(null, end, start, end)).toBe(false);
            expect(doDateRangesOverlap(start, null, start, end)).toBe(false);
            expect(doDateRangesOverlap(start, end, undefined, end)).toBe(false);
            expect(doDateRangesOverlap(start, end, start, undefined)).toBe(false);
        });
    });
});
