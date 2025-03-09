"use client";

import TaskMenu from "./TaskMenu";
import { isUserHost } from "../../../lib/definitions";
import { isEventPublished, isUserParticipant } from "../event-utils";
import { useUserContext } from "../../../context/UserContext";
import KanBanBoard from "../../../ui/KanBanBoard";

const TaskDashboard = ({
    event,
    readOnly,
    fetchEventAction,
    tasks,
    fetchTasksAction,
    isTasksPending,
}) => {
    const { user } = useUserContext();

    return (
        <>
            {(isUserHost(user, event) && isEventPublished(event)) ||
            isUserParticipant(user, event) ? (
                <KanBanBoard
                    tasks={tasks}
                    fetchDbTasks={fetchTasksAction}
                    readOnly={readOnly}
                    isTasksPending={isTasksPending}
                />
            ) : (
                <TaskMenu
                    event={event}
                    fetchEventAction={fetchEventAction}
                    readOnly={readOnly}
                    tasks={tasks}
                    fetchTasksAction={fetchTasksAction}
                    isTasksPending={isTasksPending}
                />
            )}
        </>
    );
};

export default TaskDashboard;
