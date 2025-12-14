import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getFilteredTasks } from "../../lib/task-actions";
import GlobalConstants from "../../GlobalConstants";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import { getAllSkillBadges } from "../../lib/skill-badge-actions";
import { isUserAdmin } from "../../lib/utils";

const TasksPage = async () => {
    const loggedInUser = await getLoggedInUser();
    const tasksPromise = getFilteredTasks({
        event_id: null,
    });
    const activeMembersPromise = getActiveMembers();
    const skillBadgesPromise = getAllSkillBadges();

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
