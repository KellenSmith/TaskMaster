import { unstable_cache } from "next/cache";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getFilteredTasks } from "../../lib/task-actions";
import GlobalConstants from "../../GlobalConstants";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import { getActiveMembers } from "../../lib/user-actions";

const TasksPage = () => {
    const tasksPromise = unstable_cache(getFilteredTasks, [], { tags: [GlobalConstants.TASK] })({
        eventId: null,
    });
    const activeMembersPromise = unstable_cache(getActiveMembers, [], {
        tags: [GlobalConstants.USER],
    })();

    return (
        <ErrorBoundarySuspense errorMessage="Failed to load tasks">
            <KanBanBoard
                readOnly={false}
                tasksPromise={tasksPromise}
                activeMembersPromise={activeMembersPromise}
            />
        </ErrorBoundarySuspense>
    );
};

export default TasksPage;
