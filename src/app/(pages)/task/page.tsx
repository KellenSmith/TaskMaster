import GlobalConstants from "../../GlobalConstants";
import { getTaskById } from "../../lib/task-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import TaskDashboard from "./TaskDashboard";
import { getAllSkillBadges } from "../../lib/skill-badge-actions";
import { getActiveMembers } from "../../lib/user-actions";

const TaskPage = async ({ searchParams }) => {
    const taskId = (await searchParams)[GlobalConstants.TASK_ID];
    const taskPromise = getTaskById(taskId);
    const skillBadgesPromise = getAllSkillBadges();
    const activeMembersPromise = getActiveMembers();
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
