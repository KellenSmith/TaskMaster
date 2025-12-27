import GlobalConstants from "../../GlobalConstants";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import TaskDashboard from "./TaskDashboard";
import { getActiveMembers } from "../../lib/user-actions";
import { prisma } from "../../../../prisma/prisma-client";

const TaskPage = async ({ searchParams }) => {
    const taskId = (await searchParams)[GlobalConstants.TASK_ID];
    const taskPromise = prisma.task.findUniqueOrThrow({
        where: {
            id: taskId,
        },
        include: {
            assignee: { select: { id: true, nickname: true } },
            reviewer: { select: { id: true, nickname: true } },
            event: true,
            skill_badges: true,
        },
    });
    const skillBadgesPromise = prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
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
