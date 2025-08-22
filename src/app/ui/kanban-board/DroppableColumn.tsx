import { Button, Dialog, Paper, Stack, Typography, useTheme } from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { createTask, updateTaskById } from "../../lib/task-actions";
import Form from "../form/Form";
import { use, useState } from "react";
import { getSortedTaskComps } from "../../(pages)/event/event-utils";
import { Add } from "@mui/icons-material";
import { FieldLabels, getUserSelectOptions } from "../form/FieldCfg";
import { Prisma, Task, TaskPhase, TaskStatus } from "@prisma/client";
import dayjs from "dayjs";
import z from "zod";
import { TaskCreateSchema } from "../../lib/zod-schemas";
import { useNotificationContext } from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";
import DraggableTaskShifts from "./DraggableTaskShifts";

interface DroppableColumnProps {
    readOnly: boolean;
    event: Prisma.EventGetPayload<{
        include: { host: { select: { id: true; nickname: true } } };
    }> | null;
    status: TaskStatus;
    tasks: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } } };
    }>[];
    activeMembersPromise?: Promise<
        Prisma.UserGetPayload<{ select: { id: true; nickname: true } }>[]
    >;

    draggedTask: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } } };
    }> | null;
    setDraggedTask: (
        // eslint-disable-next-line no-unused-vars
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }> | null,
    ) => void;
    draggedOverColumn: TaskStatus | null;
    setDraggedOverColumn: (column: TaskStatus | null) => void; // eslint-disable-line no-unused-vars
}

const DroppableColumn = ({
    readOnly,
    event = null,
    status,
    tasks,
    activeMembersPromise,
    draggedTask,
    setDraggedTask,
    draggedOverColumn,
    setDraggedOverColumn,
}: DroppableColumnProps) => {
    const theme = useTheme();
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [taskFormDefaultValues, setTaskFormDefaultValues] = useState(null);
    const activeMembers = use(activeMembersPromise || Promise.resolve([]));

    const handleDrop = async (status: TaskStatus) => {
        if (draggedTask?.status !== status) {
            try {
                await updateTaskById(draggedTask.id, {
                    status,
                });
                addNotification(`Task set to "${FieldLabels[status]}"`, "success");
            } catch {
                addNotification(`Failed to transition task`, "error");
            }
        }
        setDraggedTask(null);
        setDraggedOverColumn(null);
    };

    const getTaskShiftsComp = (
        taskList: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>[],
    ) => {
        return (
            <DraggableTaskShifts
                readOnly={readOnly}
                taskList={taskList}
                activeMembersPromise={activeMembersPromise}
                setDraggedTask={setDraggedTask}
                openCreateTaskDialog={openCreateTaskDialog}
            />
        );
    };

    const getTaskDefaultStartTime = (taskPhase: TaskPhase) => {
        if (taskPhase === TaskPhase.before) {
            return (event ? dayjs(event.startTime) : dayjs().minute(0)).subtract(1, "d").toDate();
        }
        if (taskPhase === TaskPhase.during) {
            return (event ? dayjs(event.startTime) : dayjs().minute(0)).toDate();
        }
        if (taskPhase === TaskPhase.after) {
            return (event ? dayjs(event.endTime) : dayjs().minute(0)).toDate();
        }
    };

    const getTaskDefaultEndTime = (taskPhase: TaskPhase): Date => {
        if (taskPhase === TaskPhase.before) {
            return (event ? dayjs(event.startTime) : dayjs().minute(0)).toDate();
        }
        if (taskPhase === TaskPhase.during) {
            return (event ? dayjs(event.endTime) : dayjs().minute(0)).toDate();
        }
        if (taskPhase === TaskPhase.after) {
            return (event ? dayjs(event.endTime) : dayjs().minute(0)).add(1, "d").toDate();
        }
    };

    const openCreateTaskDialog = (shiftProps: Task | null) => {
        const taskPhase = shiftProps?.phase || TaskPhase.before;
        const defaultTask = {
            status,
            phase: taskPhase,
            reviewerId: user.id,
            startTime: getTaskDefaultStartTime(taskPhase),
            endTime: getTaskDefaultEndTime(taskPhase),
            ...shiftProps,
        } as Task;
        setTaskFormDefaultValues(defaultTask);
    };

    const createNewTask = async (
        parsedFieldValues: z.infer<typeof TaskCreateSchema>,
    ): Promise<string> => {
        const eventIdInput = event ? event.id : null;
        await createTask({ ...taskFormDefaultValues, ...parsedFieldValues, eventId: eventIdInput });
        setTaskFormDefaultValues(null);
        return "Created task";
    };

    return (
        <>
            <Paper
                elevation={3}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDraggedOverColumn(status);
                }}
                onDrop={() => handleDrop(status)}
                sx={{
                    height: "100%",
                    padding: "16px",
                    ...(draggedOverColumn === status && {
                        backgroundColor: theme.palette.primary.light,
                    }),
                }}
            >
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6">{FieldLabels[status].toUpperCase()}</Typography>
                    {!readOnly && (
                        <Button onClick={() => openCreateTaskDialog(null)}>
                            <Add />
                        </Button>
                    )}
                </Stack>
                <Stack spacing={2}>{getSortedTaskComps(tasks, getTaskShiftsComp)}</Stack>
            </Paper>
            <Dialog open={!!taskFormDefaultValues} onClose={() => setTaskFormDefaultValues(null)}>
                <Form
                    name={GlobalConstants.TASK}
                    action={createNewTask}
                    validationSchema={TaskCreateSchema}
                    defaultValues={taskFormDefaultValues}
                    customOptions={{
                        [GlobalConstants.ASSIGNEE_ID]: getUserSelectOptions(activeMembers),
                        [GlobalConstants.REVIEWER_ID]: getUserSelectOptions(activeMembers),
                    }}
                    buttonLabel="add task"
                    readOnly={false}
                    editable={false}
                />
            </Dialog>
        </>
    );
};

export default DroppableColumn;
