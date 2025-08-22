import dayjs from "dayjs";
import GlobalConstants from "../../GlobalConstants";
import { EventStatus, Prisma, Task } from "@prisma/client";

export const isEventPublished = (event) =>
    event[GlobalConstants.STATUS] === GlobalConstants.PUBLISHED;

export const isUserParticipant = (
    user: any,
    eventParticipants: Prisma.ParticipantInEventGetPayload<{
        include: { user: { select: { id: true } } };
    }>[],
) => !!eventParticipants.find((participant) => participant.user.id === user[GlobalConstants.ID]);

export const isTaskSelected = (task: Task, selectedTasks: Task[]) =>
    selectedTasks.map((task) => task.id).includes(task.id);

export const getEarliestStartTime = (tasks: Task[]) =>
    tasks
        .map((task) => task.startTime)
        .sort((startTime1, startTime2) => dayjs(startTime1).diff(dayjs(startTime2)))[0];

export const getEarliestEndTime = (tasks: Task[]) =>
    tasks
        .map((task) => task.endTime)
        .sort((startTime1, startTime2) => dayjs(startTime1).diff(dayjs(startTime2)))[0];

export const getLatestEndTime = (tasks: Task[]) =>
    tasks
        .map((task) => task.endTime)
        .sort((startTime1, startTime2) => dayjs(startTime1).diff(dayjs(startTime2)))
        .at(-1);

export const sortTasks = (task1: Task, task2: Task) => {
    const startTime1 = dayjs(task1.startTime);
    const startTime2 = dayjs(task2.startTime);
    if (Math.abs(startTime2.diff(startTime1, "minute")) > 1)
        return startTime1.diff(startTime2, "minute");

    const endTime1 = dayjs(task1.endTime);
    const endTime2 = dayjs(task2.endTime);
    if (Math.abs(endTime2.diff(endTime1, "minute")) > 1) return endTime1.diff(endTime2, "minute");

    return task1.name.localeCompare(task2.name);
};

export const sortGroupedTasks = (groupedTasks: Task[][]) => {
    return groupedTasks.sort((taskGroup1, taskGroup2) => {
        const sortTask1 = {
            startTime: getEarliestStartTime(taskGroup1),
            endTime: getEarliestEndTime(taskGroup1),
            name: taskGroup1[0].name,
        } as Task;
        const sortTask2 = {
            startTime: getEarliestStartTime(taskGroup2),
            endTime: getEarliestEndTime(taskGroup2),
            name: taskGroup2[0].name,
        } as Task;
        return sortTasks(sortTask1, sortTask2);
    });
};

export const getSortedTaskComps = (
    taskList: Task[],
    getTaskShiftsComp: (taskGroup: Task[]) => any,
) => {
    if (taskList.length < 1) return [];
    const uniqueTaskNames = [...new Set(taskList.map((task) => task.name))];
    const sortedTasksGroupedByName = sortGroupedTasks(
        uniqueTaskNames.map((taskName) => taskList.filter((task) => task.name === taskName)),
    );
    return sortedTasksGroupedByName.map((taskGroup) => getTaskShiftsComp(taskGroup));
};

export const isEventSoldOut = (
    event: Prisma.EventGetPayload<{ include: { host: { select: { id: true; nickname: true } } } }>,
    eventParticipants: Prisma.ParticipantInEventGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[],
) => event && eventParticipants.length >= event.maxParticipants;

export const isEventCancelled = (
    event: Prisma.EventGetPayload<{ include: { host: { select: { id: true; nickname: true } } } }>,
) => event && event.status === EventStatus.cancelled;
