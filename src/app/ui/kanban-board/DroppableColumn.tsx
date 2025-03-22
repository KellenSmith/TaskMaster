import {
    Accordion,
    AccordionSummary,
    Card,
    CircularProgress,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { updateTaskById } from "../../lib/task-actions";
import { defaultActionState } from "../form/Form";
import { startTransition } from "react";
import {
    getEarliestStartTime,
    getLatestEndTime,
    getSortedTaskComps,
    sortTasks,
} from "../../(pages)/calendar/[event-id]/event-utils";
import DraggableTask from "./DraggableTask";
import { ExpandMore } from "@mui/icons-material";
import { formatDate } from "../utils";

const DroppableColumn = ({
    status,
    tasks,
    isTasksPending,
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
                    </Stack>
                </Accordion>
            </Card>
        );
    };

    return (
        <Paper
            elevation={3}
            onDragOver={(e) => {
                e.preventDefault();
                setDraggedOverColumn(status);
            }}
            onDrop={() => handleDrop(status)}
            style={{
                padding: "16px",
                ...(draggedOverColumn === status && {
                    backgroundColor: theme.palette.primary.light,
                }),
            }}
        >
            <Typography variant="h6">{status.toUpperCase()}</Typography>
            <Stack spacing={2}>
                {isTasksPending ? (
                    <CircularProgress />
                ) : (
                    getSortedTaskComps(tasks, getTaskShiftsComp)
                )}
            </Stack>
        </Paper>
    );
};

export default DroppableColumn;
