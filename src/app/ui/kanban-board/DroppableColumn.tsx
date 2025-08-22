import {
    Accordion,
    AccordionSummary,
    Button,
    Card,
    Dialog,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { createTask, updateTaskById } from "../../lib/task-actions";
import Form from "../form/Form";
import { use, useState } from "react";
import {
    getEarliestStartTime,
    getLatestEndTime,
    getSortedTaskComps,
    sortTasks,
} from "../../(pages)/event/event-utils";
import DraggableTask from "./DraggableTask";
import { Add, ExpandMore } from "@mui/icons-material";
import { formatDate } from "../utils";
import { FieldLabels, getUserSelectOptions } from "../form/FieldCfg";
import { Prisma, Task, TaskPhase, TaskStatus } from "@prisma/client";
import dayjs from "dayjs";
import z from "zod";
import { TaskCreateSchema, TaskUpdateSchema } from "../../lib/zod-schemas";
import { useNotificationContext } from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";

interface DroppableColumnProps {
    readOnly: boolean;
    event: Prisma.EventGetPayload<{
        include: { host: { select: { id: true; nickname: true } } };
    }> | null;
    status: TaskStatus;
    tasks: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } } };
    }>[];
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{ select: { id: true; nickname: true } }>[]
    >;

    draggedTask: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } } };
    }> | null;
    setDraggedTask: (
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }> | null,
    ) => void;
    draggedOverColumn: TaskStatus | null;
    setDraggedOverColumn: (column: TaskStatus | null) => void;
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
    const activeMembers = use(activeMembersPromise);
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    const [addTask, setAddTask] = useState(null);

    const handleDrop = async (status: TaskStatus) => {
        if (draggedTask?.status !== status) {
            try {
                await updateTaskById(draggedTask.id, {
                    status,
                });
                addNotification(`Task set to ${status}`, "success");
            } catch (error) {
                addNotification(`Failed to transition task`, "error");
            }
        }
        setDraggedTask(null);
        setDraggedOverColumn(null);
    };

    const getTaskShiftsComp = (taskList: any[]) => {
        if (taskList.length === 1)
            return (
                <DraggableTask
                    readOnly={readOnly}
                    key={taskList[0][GlobalConstants.ID]}
                    task={taskList[0]}
                    activeMembersPromise={activeMembersPromise}
                    setDraggedTask={setDraggedTask}
                />
            );
        return (
            <Card key={taskList[0][GlobalConstants.NAME]}>
                <Stack
                    paddingLeft={2}
                    paddingTop={2}
                    direction="row"
                    justifyContent="space-between"
                >
                    <Typography variant="body1">{taskList[0][GlobalConstants.NAME]}</Typography>
                    <Typography variant="body1">
                        {formatDate(getEarliestStartTime(tasks)) +
                            " - " +
                            formatDate(getLatestEndTime(tasks))}
                    </Typography>
                </Stack>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>Shifts</AccordionSummary>
                    <Stack paddingLeft={2}>
                        {taskList.sort(sortTasks).map((task) => (
                            <DraggableTask
                                key={task[GlobalConstants.ID]}
                                readOnly={readOnly}
                                task={task}
                                setDraggedTask={setDraggedTask}
                                activeMembersPromise={activeMembersPromise}
                            />
                        ))}
                        {!readOnly && (
                            <Button
                                onClick={() => {
                                    const latestEndTime = getLatestEndTime(taskList);
                                    const newTaskShift = Object.fromEntries(
                                        Object.entries(taskList[0]).filter(
                                            // Don't copy id to new task shift
                                            // eslint-disable-next-line no-unused-vars
                                            ([key, value]) => key !== GlobalConstants.ID,
                                        ),
                                    ) as Task;
                                    newTaskShift.startTime = latestEndTime;
                                    newTaskShift.endTime = dayjs(latestEndTime)
                                        .add(organizationSettings.defaultTaskShiftLength, "hour")
                                        .toDate();
                                    openAddTaskDialog(newTaskShift);
                                }}
                            >
                                add shift
                            </Button>
                        )}
                    </Stack>
                </Accordion>
            </Card>
        );
    };

    const getTaskDefaultStartTime = (taskPhase: TaskPhase) => {
        if (taskPhase === TaskPhase.before) {
            return (event ? dayjs(event.startTime) : dayjs()).subtract(1, "d").toDate();
        }
        if (taskPhase === TaskPhase.during) {
            return (event ? dayjs(event.startTime) : dayjs()).toDate();
        }
        if (taskPhase === TaskPhase.after) {
            return (event ? dayjs(event.endTime) : dayjs()).toDate();
        }
    };

    const getTaskDefaultEndTime = (taskPhase: TaskPhase): Date => {
        if (taskPhase === TaskPhase.before) {
            return (event ? dayjs(event.startTime) : dayjs()).toDate();
        }
        if (taskPhase === TaskPhase.during) {
            return (event ? dayjs(event.endTime) : dayjs()).toDate();
        }
        if (taskPhase === TaskPhase.after) {
            return (event ? dayjs(event.endTime) : dayjs()).add(1, "d").toDate();
        }
    };

    const openAddTaskDialog = (shiftProps: Task | null) => {
        const taskPhase = shiftProps?.phase || TaskPhase.before;
        const defaultTask = {
            status,
            phase: taskPhase,
            reviewerId: user.id,
            startTime: getTaskDefaultStartTime(taskPhase),
            endTime: getTaskDefaultEndTime(taskPhase),
            ...shiftProps,
        } as Task;
        setAddTask(defaultTask);
    };

    const createNewTask = async (
        parsedFieldValues: z.infer<typeof TaskCreateSchema>,
    ): Promise<string> => {
        const eventIdInput = event ? event.id : null;
        await createTask({ ...addTask, ...parsedFieldValues, eventId: eventIdInput });
        setAddTask(null);
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
                        // eslint-disable-next-line no-unused-vars
                        <Button onClick={() => openAddTaskDialog(null)}>
                            <Add />
                        </Button>
                    )}
                </Stack>
                <Stack spacing={2}>{getSortedTaskComps(tasks, getTaskShiftsComp)}</Stack>
            </Paper>
            <Dialog open={!!addTask} onClose={() => setAddTask(null)}>
                <Form
                    name={GlobalConstants.TASK}
                    action={createNewTask}
                    validationSchema={TaskCreateSchema}
                    defaultValues={addTask}
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
