import { startTransition, useActionState, useEffect } from "react";
import { getFilteredTasks } from "../../lib/task-actions";
import { useUserContext } from "../../context/UserContext";
import GlobalConstants from "../../GlobalConstants";
import { defaultActionState as defaultDatagridActionState } from "../../ui/Datagrid";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";

const TasksTab = () => {
    const { user } = useUserContext();

    const fetchMyTasks = async () => {
        return await getFilteredTasks(
            { assigneeId: user[GlobalConstants.ID] },
            defaultDatagridActionState,
        );
    };

    const [tasksActionState, fetchTasksAction, isTasksPending] = useActionState(
        fetchMyTasks,
        defaultDatagridActionState,
    );

    useEffect(() => {
        startTransition(() => fetchTasksAction());
        // Fetch tasks on first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <KanBanBoard
            tasks={tasksActionState.result}
            fetchDbTasks={fetchTasksAction}
            readOnly={true}
            isTasksPending={isTasksPending}
        />
    );
};

export default TasksTab;
