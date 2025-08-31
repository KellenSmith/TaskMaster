import { unstable_cache } from "next/cache";
import GlobalConstants from "../../GlobalConstants";
import { getTaskById } from "../../lib/task-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import TaskDashboard from "./TaskDashboard";
import { getAllSkillBadges } from "../../lib/skill-badge-actions";
import { getActiveMembers } from "../../lib/user-actions";

const TaskPage = async ({ searchParams }) => {
    const taskId = (await searchParams)[GlobalConstants.TASK_ID];
    const taskPromise = unstable_cache(getTaskById, [taskId], { tags: [GlobalConstants.TASK] })(
        taskId,
    );
    const skillBadgesPromise = unstable_cache(getAllSkillBadges, [], {
        tags: [GlobalConstants.SKILL_BADGE],
    })();
    const activeMembersPromise = unstable_cache(getActiveMembers, [], {
        tags: [GlobalConstants.USER],
    })();
    return (
        <ErrorBoundarySuspense>
            <TaskDashboard
                taskPromise={taskPromise}
                skillBadgesPromise={skillBadgesPromise}
                activeMembersPromise={activeMembersPromise}
            />
        </ErrorBoundarySuspense>
    );
};

export default TaskPage;
