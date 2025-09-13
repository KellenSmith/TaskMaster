import dayjs from "dayjs";
import { EventStatus, Prisma, Task } from "@prisma/client";

export const isEventPublished = (event: Prisma.EventGetPayload<true>) =>
    event.status === EventStatus.published;

export const isUserParticipant = (
    user: Prisma.UserGetPayload<{ include: { user_membership: true } }>,
    event: Prisma.EventGetPayload<{
        include: { tickets: { include: { event_participants: true } } };
    }>,
) =>
    !!event?.tickets.find((ticket) =>
        ticket?.event_participants.find((participant) => participant?.user_id === user?.id),
    );

export // Helper function to check if user is on reserve list
const isUserReserve = (
    user: Prisma.UserGetPayload<{ include: { user_membership: true } }>,
    event: Prisma.EventGetPayload<{
        include: { event_reserves: true };
    }>,
): boolean => {
    if (!event.event_reserves || !user) return false;
    return !!event.event_reserves.find((reserve) => reserve.user_id === user.id);
};

// User is volunteer if assigned to at least one task
export const isUserVolunteer = (
    user: Prisma.UserGetPayload<true>,
    eventTasks: Prisma.TaskGetPayload<true>[],
) => {
    if (!eventTasks || !user) return false;
    return !!eventTasks.find((task) => task.assignee_id === user.id);
};

export const isTaskSelected = (task: Task, selectedTasks: Task[]) =>
    selectedTasks.map((task) => task.id).includes(task.id);

export const getEarliestStartTime = (tasks: Task[]) =>
    tasks
        .map((task) => task.start_time)
        .sort((startTime1, startTime2) => dayjs.utc(startTime1).diff(dayjs.utc(startTime2)))[0];

export const getEarliestEndTime = (tasks: Task[]) =>
    tasks
        .map((task) => task.end_time)
        .sort((startTime1, startTime2) => dayjs.utc(startTime1).diff(dayjs.utc(startTime2)))[0];

export const sortTasks = (task1: Task, task2: Task) => {
    const startTime1 = dayjs.utc(task1.start_time);
    const startTime2 = dayjs.utc(task2.start_time);
    if (Math.abs(startTime2.diff(startTime1, "minute")) > 1)
        return startTime1.diff(startTime2, "minute");

    const endTime1 = dayjs.utc(task1.end_time);
    const endTime2 = dayjs.utc(task2.end_time);
    if (Math.abs(endTime2.diff(endTime1, "minute")) > 1) return endTime1.diff(endTime2, "minute");

    return task1.name.localeCompare(task2.name);
};

export const getTasksSortedByTime = <T extends Prisma.TaskGetPayload<true>>(taskList: T[]): T[] =>
    taskList.sort((task1, task2) => {
        const startTime1 = dayjs.utc(task1.start_time);
        const startTime2 = dayjs.utc(task2.start_time);
        if (startTime1.isBefore(startTime2, "minute")) return -1;
        if (startTime1.isAfter(startTime2, "minute")) return 1;

        const endTime1 = dayjs.utc(task1.end_time);
        const endTime2 = dayjs.utc(task2.end_time);
        if (endTime1.isBefore(endTime2, "minute")) return -1;
        if (endTime1.isAfter(endTime2, "minute")) return 1;

        return task1.name.localeCompare(task2.name);
    });

export const getGroupedAndSortedTasks = <T extends Prisma.TaskGetPayload<true>>(
    taskList: T[],
): T[][] => {
    const uniqueGroupNames = [...new Set(taskList.map((task) => task.name))];
    const groupsOfSortedTasks = uniqueGroupNames.map((groupName) =>
        getTasksSortedByTime(taskList.filter((task) => task.name === groupName)),
    );
    return groupsOfSortedTasks.sort((sortedTaskList1, sortedTaskList2) => {
        const earliestTask1 = sortedTaskList1[0];
        const earliestTask2 = sortedTaskList2[0];
        const comparison = getTasksSortedByTime([earliestTask1, earliestTask2]);
        if (comparison[0].id === earliestTask1.id) return -1;
        if (comparison[0].id === earliestTask2.id) return 1;
        throw new Error("Unreachable");
    });
};

export const getSortedEvents = <T extends Prisma.EventGetPayload<true>>(events: T[]): T[] => {
    return events.toSorted((a, b) => {
        const aStart = dayjs.utc(a.start_time);
        const bStart = dayjs.utc(b.start_time);
        if (aStart.isSame(bStart)) return a.title.localeCompare(b.title);
        return aStart.isBefore(bStart) ? -1 : 1;
    });
};

export const getEventParticipantCount = (
    event: Prisma.EventGetPayload<{
        include: { tickets: { include: { event_participants: true } } };
    }>,
) => event?.tickets.reduce((acc, ticket) => acc + ticket.event_participants.length, 0);

export const isEventSoldOut = (
    event: Prisma.EventGetPayload<{
        include: { tickets: { include: { event_participants: true } } };
    }>,
) => !!(getEventParticipantCount(event) >= event.max_participants);

export const isEventCancelled = (event: Prisma.EventGetPayload<true>) =>
    event && event.status === EventStatus.cancelled;

export const doDateRangesOverlap = (start1: Date, end1: Date, start2: Date, end2: Date) => {
    return dayjs.utc(start1).isBefore(end2) && dayjs.utc(end1).isAfter(start2);
};
