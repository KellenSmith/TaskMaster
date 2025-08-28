"use client";

import React, { use, useState } from "react";
import { Button, Grid2, Stack, Typography } from "@mui/material";
import DroppableColumn from "./DroppableColumn";
import TaskSchedulePDF from "./TaskSchedulePDF";
import { pdf } from "@react-pdf/renderer";
import { Prisma, TaskStatus } from "@prisma/client";
import { openResourceInNewTab } from "../utils";
import KanBanBoardFilter from "./KanBanBoardFilter";

interface KanBanBoardProps {
    readOnly: boolean;
    eventPromise?: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { eventParticipants: true } } };
        }>
    >;
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } }; skillBadges: true };
        }>[]
    >;
    activeMembersPromise?: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skillBadges: true };
        }>[]
    >;
    skillBadgesPromise: Promise<
        Prisma.SkillBadgeGetPayload<{ select: { id: true; name: true } }>[]
    >;
}

const KanBanBoard = ({
    readOnly = true,
    eventPromise,
    tasksPromise,
    activeMembersPromise,
    skillBadgesPromise,
}: KanBanBoardProps) => {
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const event = eventPromise ? use(eventPromise) : null;
    const tasks = use(tasksPromise);
    const [filteredTasks, setFilteredTasks] = useState(tasks);

    const printVisibleTasksToPdf = async () => {
        const taskSchedule = await pdf(
            <TaskSchedulePDF event={event} tasks={filteredTasks} />,
        ).toBlob();
        const url = URL.createObjectURL(taskSchedule);
        openResourceInNewTab(url);
    };

    return (
        <Stack spacing={2} justifyContent="center" height="100%">
            <KanBanBoardFilter tasksPromise={tasksPromise} setFilteredTasks={setFilteredTasks} />
            <Button fullWidth onClick={printVisibleTasksToPdf}>
                print task schedule
            </Button>
            {event && (
                <Typography textAlign="center" variant="h4" color="primary">
                    Assign yourself to tasks and shifts to help make the event happen
                </Typography>
            )}
            <Grid2 container spacing={2} columns={4} height="100%">
                {Object.values(TaskStatus).map((status) => (
                    <Grid2 size={1} key={status} height="100%">
                        <DroppableColumn
                            readOnly={readOnly}
                            eventPromise={eventPromise}
                            status={status}
                            tasks={filteredTasks.filter((task) => task.status === status)}
                            activeMembersPromise={activeMembersPromise}
                            skillBadgesPromise={skillBadgesPromise}
                            draggedTask={draggedTask}
                            setDraggedTask={setDraggedTask}
                            draggedOverColumn={draggedOverColumn}
                            setDraggedOverColumn={setDraggedOverColumn}
                        />
                    </Grid2>
                ))}
            </Grid2>
        </Stack>
    );
};

export default KanBanBoard;
