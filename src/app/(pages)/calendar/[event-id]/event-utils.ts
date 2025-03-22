import dayjs from "dayjs";
import GlobalConstants from "../../../GlobalConstants";

export const isEventPublished = (event) =>
    event[GlobalConstants.STATUS] === GlobalConstants.PUBLISHED;

export const isUserParticipant = (user: any, event: any) =>
    event[GlobalConstants.PARTICIPANT_USERS]
        .map((participant: any) => participant[GlobalConstants.USER_ID])
        .includes(user[GlobalConstants.ID]);

export const isTaskSelected = (task: any, selectedTasks: any[]) =>
    selectedTasks.map((task) => task[GlobalConstants.ID]).includes(task[GlobalConstants.ID]);

export const getEarliestStartTime = (tasks) =>
    tasks
        .map((task) => task[GlobalConstants.START_TIME])
        .sort((startTime1, startTime2) => dayjs(startTime1).diff(dayjs(startTime2)))[0];

export const getEarliestEndTime = (tasks) =>
    tasks
        .map((task) => task[GlobalConstants.END_TIME])
        .sort((startTime1, startTime2) => dayjs(startTime1).diff(dayjs(startTime2)))[0];

export const getLatestEndTime = (tasks) =>
    tasks
        .map((task) => task[GlobalConstants.END_TIME])
        .sort((startTime1, startTime2) => dayjs(startTime1).diff(dayjs(startTime2)))
        .at(-1);

export const sortTasks = (task1, task2) => {
    const startTime1 = dayjs(task1[GlobalConstants.START_TIME]);
    const startTime2 = dayjs(task2[GlobalConstants.START_TIME]);
    if (Math.abs(startTime2.diff(startTime1, "minute")) > 1)
        return startTime1.diff(startTime2, "minute");

    const endTime1 = dayjs(task1[GlobalConstants.END_TIME]);
    const endTime2 = dayjs(task2[GlobalConstants.END_TIME]);
    if (Math.abs(endTime2.diff(endTime1, "minute")) > 1) return endTime1.diff(endTime2, "minute");

    return task1[GlobalConstants.NAME].localeCompare(task2[GlobalConstants.NAME]);
};
