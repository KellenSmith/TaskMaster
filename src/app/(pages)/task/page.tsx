import GlobalConstants from "../../GlobalConstants";
import TaskDashboard from "./TaskDashboard";
import { getCachedActiveMembers } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";
import { SearchParams } from "next/dist/server/request/search-params";
import ProtectedPage from "../../ProtectedPage";

const getCachedTaskById = async (taskId: string) => {
    return await prisma.task.findUniqueOrThrow({
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
};

const getCachedSkillBadges = async () => {
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const TaskPage = async ({ searchParams }: { searchParams: SearchParams }) => {
    const taskId = (await searchParams)[GlobalConstants.TASK_ID] as string;
    const taskPromise = getCachedTaskById(taskId);
    const skillBadgesPromise = getCachedSkillBadges();
    const activeMembersPromise = getCachedActiveMembers();

    // TODO: enable unassigning tasks + clone tasks and edit such that the task is unassigned
    return (
        <ProtectedPage name={GlobalConstants.TASK}>
            <TaskDashboard
                taskPromise={taskPromise}
                skillBadgesPromise={skillBadgesPromise}
                activeMembersPromise={activeMembersPromise}
            />
        </ProtectedPage>
    );
};

export default TaskPage;
