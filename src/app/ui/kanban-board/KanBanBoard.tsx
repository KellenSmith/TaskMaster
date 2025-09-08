"use client";

import React, { use, useState } from "react";
import { Grid2, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import DroppableColumn from "./DroppableColumn";
import { Prisma, TaskStatus } from "@prisma/client";
import KanBanBoardMenu from "./KanBanBoardMenu";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import z from "zod";
import { TaskFilterSchema } from "../../lib/zod-schemas";
import GlobalConstants from "../../GlobalConstants";
import { isUserAdmin, isUserHost } from "../../lib/utils";

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
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
    const { user, language } = useUserContext();
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const event = eventPromise ? use(eventPromise) : null;
    const [appliedFilter, setAppliedFilter] = useState<z.infer<typeof TaskFilterSchema> | null>(
        !(isUserHost(user, event) || isUserAdmin(user))
            ? {
                  unassigned: true,
                  [GlobalConstants.STATUS]: event ? [TaskStatus.toDo] : Object.values(TaskStatus),
              }
            : null,
    );

    return (
        <Stack spacing={2} justifyContent="center">
            <Typography variant="h4" color="primary" paddingTop={2} textAlign="center">
                {event
                    ? LanguageTranslations.assignYourselfEventPrompt[language]
                    : LanguageTranslations.assignYourselfPrompt[language]}
            </Typography>
            <Stack direction="row">
                <Grid2
                    key={appliedFilter ? JSON.stringify(appliedFilter) : "all-tasks"}
                    container
                    spacing={2}
                    columns={isSmallScreen ? 1 : appliedFilter?.status?.length || 4}
                    width="100%"
                >
                    {(appliedFilter?.status?.length > 0
                        ? (appliedFilter.status as TaskStatus[])
                        : Object.values(TaskStatus)
                    ).map((status) => (
                        <Grid2 size={1} key={status}>
                            <DroppableColumn
                                readOnly={readOnly}
                                eventPromise={eventPromise}
                                status={status}
                                tasksPromise={tasksPromise}
                                appliedFilter={appliedFilter}
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
                <KanBanBoardMenu
                    tasksPromise={tasksPromise}
                    appliedFilter={appliedFilter}
                    setAppliedFilter={setAppliedFilter}
                />
            </Stack>
        </Stack>
    );
};

export default KanBanBoard;
