"use client";

import { Prisma } from "@prisma/client";
import TaskCard from "./TaskCard";

interface TaskDashboardProps {
    taskPromise: Promise<
        Prisma.TaskGetPayload<{
            include: {
                assignee: { select: { id: true; nickname: true } };
                reviewer: { select: { id: true; nickname: true } };
                skill_badges: true;
            };
        }>
    >;
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<{}>[]>;
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skill_badges: true };
        }>[]
    >;
}

const TaskDashboard = ({
    taskPromise,
    skillBadgesPromise,
    activeMembersPromise,
}: TaskDashboardProps) => {
    return (
        <TaskCard
            taskPromise={taskPromise}
            skillBadgesPromise={skillBadgesPromise}
            activeMembersPromise={activeMembersPromise}
        />
    );
};

export default TaskDashboard;
