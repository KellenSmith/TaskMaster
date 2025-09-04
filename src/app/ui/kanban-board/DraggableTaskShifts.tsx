"use client";

import {
    Accordion,
    AccordionSummary,
    Button,
    Card,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import { formatDate } from "../utils";
import { ExpandMore } from "@mui/icons-material";
import { getEarliestStartTime, sortTasks } from "../../(pages)/event/event-utils";
import GlobalConstants from "../../GlobalConstants";
import { Prisma } from "@prisma/client";
import DraggableTask from "./DraggableTask";
import dayjs from "dayjs";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import { use } from "react";

interface DraggableTaskShiftsProps {
    readOnly: boolean;
    taskName: string;
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
        }>[]
    >;
    eventPromise?: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { event_participants: true } } };
        }>
    >;
    setDraggedTask?: (
        // eslint-disable-next-line no-unused-vars
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }> | null,
    ) => void;
    openCreateTaskDialog?: (
        // eslint-disable-next-line no-unused-vars
        defaultValues: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>,
    ) => void;
}

const DraggableTaskShifts = ({
    readOnly,
    taskName,
    tasksPromise,
    eventPromise,
    setDraggedTask,
    openCreateTaskDialog,
}: DraggableTaskShiftsProps) => {
    const { organizationSettings } = useOrganizationSettingsContext();
    const { language } = useUserContext();
    const tasks = use(tasksPromise);
    const taskList = tasks.filter((task) => task.name === taskName);

    const getLatestEndTime = () =>
        taskList
            .map((task) => task.end_time)
            .sort((startTime1, startTime2) => dayjs(startTime1).diff(dayjs(startTime2)))
            .at(-1);

    const getDefaultValuesForTaskShift = (
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>,
    ): Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } } };
    }> => {
        const newTaskShift = { ...task };
        newTaskShift.start_time = getLatestEndTime();
        newTaskShift.end_time = dayjs(newTaskShift.start_time)
            .add(organizationSettings.default_task_shift_length, "hour")
            .toDate();
        console.log(newTaskShift);
        return newTaskShift;
    };

    const getAddShiftButton = () => {
        if (readOnly) return null;
        return (
            <Button
                fullWidth
                onClick={() => openCreateTaskDialog(getDefaultValuesForTaskShift(taskList[0]))}
            >
                {LanguageTranslations.addShift[language]}
            </Button>
        );
    };

    if (taskList.length === 0) return null;
    if (taskList.length < 2)
        return (
            <Card>
                <DraggableTask
                    key={taskList[0].id}
                    readOnly={readOnly}
                    taskId={taskList[0].id}
                    tasksPromise={tasksPromise}
                    eventPromise={eventPromise}
                    setDraggedTask={setDraggedTask}
                />
                {getAddShiftButton()}
            </Card>
        );
    return (
        <Card key={taskList[0].id} sx={{ width: "100%" }}>
            <Stack
                sx={{ p: 1, pt: 1, pb: 0 }}
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={{ xs: 0.5, sm: 0 }}
            >
                <Typography variant="body1" sx={{ wordBreak: "break-word" }} noWrap={false}>
                    {taskList[0][GlobalConstants.NAME]}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ mt: { xs: 0.5, sm: 0 }, textAlign: { xs: "left", sm: "right" } }}
                >
                    {formatDate(getEarliestStartTime(taskList)) +
                        " - " +
                        formatDate(getLatestEndTime())}
                </Typography>
            </Stack>
            {taskList.length > 1 && (
                <Accordion sx={{ mt: 0 }}>
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ py: 0.5, pl: 1 }}>
                        {LanguageTranslations.shifts[language]}
                    </AccordionSummary>
                    <Stack sx={{ pl: 1 }}>
                        {taskList.sort(sortTasks).map((task) => (
                            <Stack key={task.id} spacing={0}>
                                <Divider />
                                <DraggableTask
                                    readOnly={readOnly}
                                    taskId={task.id}
                                    eventPromise={eventPromise}
                                    tasksPromise={tasksPromise}
                                    setDraggedTask={setDraggedTask}
                                />
                            </Stack>
                        ))}
                    </Stack>
                </Accordion>
            )}
            {getAddShiftButton()}
        </Card>
    );
};

export default DraggableTaskShifts;
