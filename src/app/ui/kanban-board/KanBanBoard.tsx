"use client";

import React, { use, useState } from "react";
import { Button, Grid2, Stack, Typography } from "@mui/material";
import DroppableColumn from "./DroppableColumn";
import TaskSchedulePDF from "./TaskSchedulePDF";
import { pdf } from "@react-pdf/renderer";
import { Prisma, TaskStatus } from "@prisma/client";
import { openResourceInNewTab } from "../utils";
import KanBanBoardMenu, { getFilteredTasks } from "./KanBanBoardMenu";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import z from "zod";
import { TaskFilterSchema } from "../../lib/zod-schemas";
import GlobalConstants from "../../GlobalConstants";

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
    const { user, language } = useUserContext();
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const event = eventPromise ? use(eventPromise) : null;
    const tasks = use(tasksPromise);
    const [appliedFilter, setAppliedFilter] = useState<z.infer<typeof TaskFilterSchema> | null>({
        unassigned: true,
        [GlobalConstants.STATUS]: [TaskStatus.toDo],
    });

    const printVisibleTasksToPdf = async () => {
        const taskSchedule = await pdf(
            <TaskSchedulePDF
                event={event}
                tasks={getFilteredTasks(appliedFilter, tasks, user.id)}
            />,
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
            <KanBanBoardMenu
                tasksPromise={tasksPromise}
                appliedFilter={appliedFilter}
                setAppliedFilter={setAppliedFilter}
            />
            <Grid2 container spacing={2} columns={appliedFilter?.status?.length || 4} height="100%">
                {(appliedFilter
                    ? (appliedFilter.status as TaskStatus[])
                    : Object.values(TaskStatus)
                ).map((status) => (
                    <Grid2 size={1} key={status} height="100%">
                        <DroppableColumn
                            readOnly={readOnly}
                            eventPromise={eventPromise}
                            status={status}
                            tasks={getFilteredTasks(
                                appliedFilter,
                                tasks.filter((task) => task.status === status),
                                user.id,
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
