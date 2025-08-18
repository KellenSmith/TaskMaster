"use client";

import KanBanBoard from "../../../../ui/kanban-board/KanBanBoard";
import { Suspense, use } from "react";
import { Stack, Typography } from "@mui/material";
import { Prisma } from "@prisma/client";
import { ErrorBoundary } from "react-error-boundary";

interface TaskDashboardProps {
    event: Prisma.EventGetPayload<{ include: { host: { select: { id: true; nickname: true } } } }>;
    eventTaskPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { Assignee: { select: { id: true; nickname: true } } };
        }>[]
    >;
    readOnly?: boolean;
}

const TaskDashboard = ({ event, eventTaskPromise, readOnly }: TaskDashboardProps) => {
    const tasks = use(eventTaskPromise);

    return (
        <Stack>
            <Typography textAlign="center" variant="h4" color="primary">
                Assign yourself to tasks and shifts to help make the event happen
            </Typography>
            <KanBanBoard event={event} tasks={tasks} readOnly={readOnly} />
        </Stack>
    );
};

export default TaskDashboard;
