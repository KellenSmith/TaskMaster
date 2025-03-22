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
        .sort((startTime1, startTime2) => dayjs(startTime1).isBefore(dayjs(startTime2)))[0];

export const getEarliestEndTime = (tasks) =>
    tasks
        .map((task) => task[GlobalConstants.END_TIME])
        .sort((startTime1, startTime2) => dayjs(startTime1).isBefore(dayjs(startTime2)))[0];

export const getLatestEndTime = (tasks) =>
    tasks
        .map((task) => task[GlobalConstants.END_TIME])
        .sort((startTime1, startTime2) => dayjs(startTime1).isBefore(dayjs(startTime2)))
        .at(-1);

export const sortTasks = (tasks) =>
    tasks.sort((task1, task2) => {
        if (
            dayjs(task1[GlobalConstants.START_TIME]).isSame(
                task2[GlobalConstants.START_TIME],
                "minute",
            )
        )
            return dayjs(task1[GlobalConstants.START_TIME]).isBefore(
                dayjs(task2[GlobalConstants.START_TIME]),
            );
        if (
            dayjs(task1[GlobalConstants.END_TIME]).isSame(task2[GlobalConstants.END_TIME], "minute")
        )
            return dayjs(task1[GlobalConstants.END_TIME]).isBefore(
                dayjs(task2[GlobalConstants.END_TIME]),
            );
        return task1[GlobalConstants.NAME].localeCompare(task2[GlobalConstants.NAME]);
    });
