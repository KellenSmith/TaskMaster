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

interface DraggableTaskShiftsProps {
    readOnly: boolean;
    // A list of shifts (tasks with the same name)
    taskList: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
    }>[];
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skill_badges: true };
        }>[]
    >;
    skillBadgesPromise: Promise<
        Prisma.SkillBadgeGetPayload<{ select: { id: true; name: true } }>[]
    >;
    setDraggedTask: (
        // eslint-disable-next-line no-unused-vars
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }> | null,
    ) => void;
    openCreateTaskDialog: (
        // eslint-disable-next-line no-unused-vars
        defaultValues: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>,
    ) => void;
}

const DraggableTaskShifts = ({
    readOnly,
    taskList,
    activeMembersPromise,
    skillBadgesPromise,
    setDraggedTask,
    openCreateTaskDialog,
}: DraggableTaskShiftsProps) => {
    const { organizationSettings } = useOrganizationSettingsContext();
    const { language } = useUserContext();
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
                    task={taskList[0]}
                    setDraggedTask={setDraggedTask}
                    activeMembersPromise={activeMembersPromise}
                    skillBadgesPromise={skillBadgesPromise}
                />
                {getAddShiftButton()}
            </Card>
        );
    return (
        <Card key={taskList[0].id}>
            <Stack padding="1rem 1rem 0rem 1rem" direction="row" justifyContent="space-between">
                <Typography variant="body1">{taskList[0][GlobalConstants.NAME]}</Typography>
                <Typography variant="body1">
                    {formatDate(getEarliestStartTime(taskList)) +
                        " - " +
                        formatDate(getLatestEndTime())}
                </Typography>
            </Stack>
            {taskList.length > 1 && (
                <Accordion>
                    <AccordionSummary {...(taskList.length > 1 && { expandIcon: <ExpandMore /> })}>
                        {LanguageTranslations.shifts[language]}
                    </AccordionSummary>
                    <Stack paddingLeft={2}>
                        {taskList.sort(sortTasks).map((task) => (
                            <Stack key={task.id}>
                                <Divider />
                                <DraggableTask
                                    readOnly={readOnly}
                                    task={task}
                                    setDraggedTask={setDraggedTask}
                                    activeMembersPromise={activeMembersPromise}
                                    skillBadgesPromise={skillBadgesPromise}
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
