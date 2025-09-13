import { unstable_cache } from "next/cache";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getFilteredTasks } from "../../lib/task-actions";
import GlobalConstants from "../../GlobalConstants";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import { getAllSkillBadges } from "../../lib/skill-badge-actions";
import { isUserAdmin } from "../../lib/utils";

const TasksPage = async () => {
    const loggedInUser = await getLoggedInUser();
    const tasksPromise = unstable_cache(getFilteredTasks, [], { tags: [GlobalConstants.TASK] })({
        event_id: null,
    });
    const activeMembersPromise = unstable_cache(getActiveMembers, [], {
        tags: [GlobalConstants.USER],
    })();
    const skillBadgesPromise = unstable_cache(getAllSkillBadges, [], {
        tags: [GlobalConstants.SKILL_BADGE],
    })();

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
