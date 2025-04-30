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
import Form, { defaultActionState, FormActionState } from "../form/Form";
import { startTransition, useState } from "react";
import {
    getEarliestStartTime,
    getLatestEndTime,
    getSortedTaskComps,
    sortTasks,
} from "../../(pages)/calendar/[event-id]/event-utils";
import DraggableTask from "./DraggableTask";
import { Add, ExpandMore } from "@mui/icons-material";
import { formatDate } from "../utils";
import { FieldLabels } from "../form/FieldCfg";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";

const DroppableColumn = ({
    event = null,
    status,
    tasks,
    fetchDbTasks,
    taskActionState,
    setTaskActionState,
    readOnly,
    draggedTask,
    setDraggedTask,
    draggedOverColumn,
    setDraggedOverColumn,
}) => {
    const theme = useTheme();
    const [addTask, setAddTask] = useState(null);

    const updateTaskStatus = async (task, status) => {
        const updateTaskResult = await updateTaskById(
            task[GlobalConstants.ID],
            defaultActionState,
            { [GlobalConstants.STATUS]: status },
        );
        startTransition(() => fetchDbTasks());
        setTaskActionState(updateTaskResult);
    };

    const handleDrop = (status: string) => {
        if (draggedTask?.status !== status) {
            updateTaskStatus(draggedTask, status);
        }
        setDraggedTask(null);
        setDraggedOverColumn(null);
    };

    const getTaskShiftsComp = (taskList: any[]) => {
        if (taskList.length === 1)
            return (
                <DraggableTask
                    key={taskList[0][GlobalConstants.ID]}
                    task={taskList[0]}
                    setDraggedTask={setDraggedTask}
                    fetchDbTasks={fetchDbTasks}
                    readOnly={readOnly}
                    taskActionState={taskActionState}
                    setTaskActionState={setTaskActionState}
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
                                task={task}
                                setDraggedTask={setDraggedTask}
                                fetchDbTasks={fetchDbTasks}
                                readOnly={readOnly}
                                taskActionState={taskActionState}
                                setTaskActionState={setTaskActionState}
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
                                    );
                                    newTaskShift[GlobalConstants.START_TIME] = latestEndTime;
                                    newTaskShift[GlobalConstants.END_TIME] = dayjs(latestEndTime)
                                        .add(2, "hour")
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

    const openAddTaskDialog = (shiftProps = {}) => {
        const defaultTask = {
            [GlobalConstants.STATUS]: status,
            [GlobalConstants.PHASE]: GlobalConstants.BEFORE,
            ...shiftProps,
        };
        setAddTask(defaultTask);
    };

    const createNewTask = async (
        currentActionState: FormActionState,
        fieldValues: Prisma.TaskCreateInput,
    ): Promise<FormActionState> => {
        if (event) fieldValues[GlobalConstants.EVENT_ID] = event[GlobalConstants.ID];
        const createTaskResult = await createTask(taskActionState, { ...addTask, ...fieldValues });
        setTaskActionState(createTaskResult);
        startTransition(() => fetchDbTasks());
        setAddTask(null);
        return currentActionState;
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
                    <Typography variant="h6">{status.toUpperCase()}</Typography>
                    {!readOnly && (
                        // eslint-disable-next-line no-unused-vars
                        <Button onClick={(_) => openAddTaskDialog()}>
                            <Add />
                        </Button>
                    )}
                </Stack>
                <Stack spacing={2}>{getSortedTaskComps(tasks, getTaskShiftsComp)}</Stack>
            </Paper>
            <Dialog open={!!addTask} onClose={() => setAddTask(null)}>
                {!!addTask && (
                    <>
                        <Stack padding={1}>
                            <Typography color="secondary">{`Status: ${FieldLabels[addTask[GlobalConstants.STATUS]]}`}</Typography>
                        </Stack>
                        <Form
                            name={GlobalConstants.TASK}
                            action={createNewTask}
                            defaultValues={addTask}
                            buttonLabel="add task"
                            readOnly={false}
                            editable={false}
                        />
                    </>
                )}
            </Dialog>
        </>
    );
};

export default DroppableColumn;
