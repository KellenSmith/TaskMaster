"use client";

import TaskMenu from "./TaskMenu";
import { isUserHost } from "../../../../lib/definitions";
import { isEventPublished, isUserParticipant } from "../event-utils";
import { useUserContext } from "../../../../context/UserContext";
import KanBanBoard from "../../../../ui/kanban-board/KanBanBoard";
import { getFilteredTasks } from "../../../../lib/task-actions";
import GlobalConstants from "../../../../GlobalConstants";
import { defaultActionState as defaultDatagridActionState } from "../../../../ui/Datagrid";
import { startTransition, useActionState, useEffect } from "react";

const TaskDashboard = ({ event, readOnly, fetchEventAction }) => {
    const { user } = useUserContext();

    const fetchEventTasks = async () => {
        return await getFilteredTasks(
            { eventId: event[GlobalConstants.ID] },
            defaultDatagridActionState,
        );
    };
    const [tasksActionState, fetchTasksAction, isTasksPending] = useActionState(
        fetchEventTasks,
        defaultDatagridActionState,
    );

    useEffect(() => {
        startTransition(() => fetchTasksAction());
        // Fetch tasks in first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {(isUserHost(user, event) && isEventPublished(event)) ||
            isUserParticipant(user, event) ? (
                <KanBanBoard
                    tasks={tasksActionState.result}
                    fetchDbTasks={fetchTasksAction}
                    readOnly={readOnly}
                    isTasksPending={isTasksPending}
                />
            ) : (
                <TaskMenu
                    event={event}
                    fetchEventAction={fetchEventAction}
                    readOnly={readOnly}
                    tasks={tasksActionState.result}
                    fetchTasksAction={fetchTasksAction}
                    isTasksPending={isTasksPending}
                />
            )}
        </>
    );
};

export default TaskDashboard;
