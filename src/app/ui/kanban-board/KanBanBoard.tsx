"use client";

import React, { use, useState } from "react";
import { Button, Grid2, Stack, Typography } from "@mui/material";
import DroppableColumn from "./DroppableColumn";
import TaskSchedulePDF from "./TaskSchedulePDF";
import { pdf } from "@react-pdf/renderer";
import { Prisma, TaskStatus } from "@prisma/client";
import { openResourceInNewTab } from "../utils";
import KanBanBoardFilter, { filterOptions, getFilteredTasks } from "./KanBanBoardFilter";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";

interface KanBanBoardProps {
    readOnly: boolean;
    eventPromise?: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { event_participants: true } } };
        }>
    >;
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
        }>[]
    >;
    activeMembersPromise?: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skill_badges: true };
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
    const { language } = useUserContext();
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const event = eventPromise ? use(eventPromise) : null;
    const tasks = use(tasksPromise);
    const [appliedFilter, setAppliedFilter] = useState(null);

    const printVisibleTasksToPdf = async () => {
        const taskSchedule = await pdf(
            <TaskSchedulePDF event={event} tasks={getFilteredTasks(appliedFilter, tasks)} />,
        ).toBlob();
        const url = URL.createObjectURL(taskSchedule);
        openResourceInNewTab(url);
    };

    return (
        <Stack spacing={2} justifyContent="center" height="100%">
            {event && (
                <Typography textAlign="center" variant="h4" color="primary">
                    {LanguageTranslations.assignYourselfPrompt[language]}
                </Typography>
            )}
            <KanBanBoardFilter tasksPromise={tasksPromise} setAppliedFilter={setAppliedFilter} />
            <Grid2 container spacing={2} columns={4} height="100%">
                {Object.values(TaskStatus).map((status) => (
                    <Grid2 size={1} key={status} height="100%">
                        <DroppableColumn
                            readOnly={readOnly}
                            eventPromise={eventPromise}
                            status={status}
                            tasks={getFilteredTasks(
                                appliedFilter,
                                tasks.filter((task) => task.status === status),
                            )}
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
            <Button fullWidth onClick={printVisibleTasksToPdf}>
                {LanguageTranslations.printSchedule[language]}
            </Button>
        </Stack>
    );
};

export default KanBanBoard;
