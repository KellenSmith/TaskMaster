import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getFilteredTasks } from "../../lib/task-actions";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import { isUserAdmin } from "../../lib/utils";
import { prisma } from "../../../../prisma/prisma-client";

const TasksPage = async () => {
    const loggedInUser = await getLoggedInUser();
    const tasksPromise = getFilteredTasks({
        event_id: null,
    });
    const activeMembersPromise = getActiveMembers();
    const skillBadgesPromise = prisma.skillBadge.findMany({ include: { user_skill_badges: true } });

    return (
        <ErrorBoundarySuspense>
            <KanBanBoard
                readOnly={!isUserAdmin(loggedInUser)}
                tasksPromise={tasksPromise}
                activeMembersPromise={activeMembersPromise}
                skillBadgesPromise={skillBadgesPromise}
            />
        </ErrorBoundarySuspense>
    );
};

export default TasksPage;
