import dayjs from "dayjs";
import GlobalConstants from "../../../GlobalConstants";

export const isEventPublished = (event) =>
    event[GlobalConstants.STATUS] === GlobalConstants.PUBLISHED;

export const isUserParticipant = (user: any, event: any) =>
    event[GlobalConstants.PARTICIPANT_USERS]
        .map((participant: any) => participant[GlobalConstants.USER_ID])
        .includes(user[GlobalConstants.ID]);

export const sortTasks = (tasks) =>
    tasks.sort((taska, taskb) => {
        if (
            dayjs(taska[GlobalConstants.END_TIME]).isSame(
                dayjs(taskb[GlobalConstants.END_TIME]),
                "minute",
            )
        ) {
            if (
                dayjs(taska[GlobalConstants.START_TIME]).isSame(
                    dayjs(taskb[GlobalConstants.START_TIME]),
                    "minute",
                )
            )
                return taska[GlobalConstants.NAME].localeCompare(taskb[GlobalConstants.NAME]);
            return dayjs(taska[GlobalConstants.START_TIME]).isBefore(
                dayjs(taskb[GlobalConstants.START_TIME]),
            );
        }
        return dayjs(taska[GlobalConstants.END_TIME]).isBefore(
            dayjs(taskb[GlobalConstants.END_TIME]),
        );
    });

export const isTaskSelected = (task: any, selectedTasks: any[]) =>
    selectedTasks.map((task) => task[GlobalConstants.ID]).includes(task[GlobalConstants.ID]);
