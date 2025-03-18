import { CircularProgress, Paper, Stack, Typography, useTheme } from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { updateTaskById } from "../../lib/task-actions";
import { defaultActionState } from "../form/Form";
import { startTransition } from "react";
import { sortTasks } from "../../(pages)/calendar/[event-id]/event-utils";
import DraggableTask from "./DraggableTask";

const DroppableColumn = ({
    status,
    tasks,
    isTasksPending,
    draggedOverColumn,
    setDraggedOverColumn,
    draggedTask,
    setDraggedTask,
    setViewTask,
    fetchDbTasks,
    setTaskActionState,
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

    const handleDrop = (status) => {
        if (draggedTask?.status !== status) {
            updateTaskStatus(draggedTask, status);
        }
        setDraggedTask(null);
        setDraggedOverColumn(null);
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
                    sortTasks(tasks.filter((task) => task.status === status)).map((task) => (
                        <DraggableTask
                            key={task[GlobalConstants.ID]}
                            task={task}
                            setDraggedTask={setDraggedTask}
                            setViewTask={setViewTask}
                        />
                    ))
                )}
            </Stack>
        </Paper>
    );
};

export default DroppableColumn;
