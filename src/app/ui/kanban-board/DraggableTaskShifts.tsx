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

interface DraggableTaskShiftsProps {
    readOnly: boolean;
    // A list of shifts (tasks with the same name)
    taskList: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } } };
    }>[];
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{ select: { id: true; nickname: true } }>[]
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
    setDraggedTask,
    openCreateTaskDialog,
}: DraggableTaskShiftsProps) => {
    const { organizationSettings } = useOrganizationSettingsContext();

    const getLatestEndTime = () =>
        taskList
            .map((task) => task.endTime)
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
        newTaskShift.startTime = getLatestEndTime();
        newTaskShift.endTime = dayjs(newTaskShift.startTime)
            .add(organizationSettings.defaultTaskShiftLength, "hour")
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
                add shift
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
                        Shifts
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
