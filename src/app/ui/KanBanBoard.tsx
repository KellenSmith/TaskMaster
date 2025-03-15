"use client";

import React, { startTransition, useState } from "react";
import {
    Button,
    Card,
    CircularProgress,
    Dialog,
    Grid2,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import { deleteTask, updateTaskById } from "../lib/task-actions";
import GlobalConstants from "../GlobalConstants";
import Form, { defaultActionState, getFormActionMsg } from "./form/Form";
import { sortTasks } from "../(pages)/calendar/[event-id]/event-utils";
import { formatDate } from "./utils";

const KanBanBoard = ({ tasks, fetchDbTasks, isTasksPending, readOnly = true }) => {
    const theme = useTheme();
    const [viewTask, setViewTask] = useState(null);
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const [taskActionState, setTaskActionState] = useState(defaultActionState);

    const updateTaskStatus = async (task, status) => {
        const updateTaskResult = await updateTaskById(
            task[GlobalConstants.ID],
            defaultActionState,
            { [GlobalConstants.STATUS]: status },
        );
        startTransition(() => fetchDbTasks());
        setTaskActionState(updateTaskResult);
    };

    const deleteViewTask = async () => {
        const deleteTaskResult = await deleteTask(viewTask[GlobalConstants.ID], taskActionState);
        startTransition(() => fetchDbTasks());
        setTaskActionState(deleteTaskResult);
        setViewTask(null);
    };

    const handleDragStart = (task) => {
        setDraggedTask(task);
    };

    const handleDragOver = (status) => {
        setDraggedOverColumn(status);
    };

    const handleDrop = (status) => {
        if (draggedTask?.status !== status) {
            updateTaskStatus(draggedTask, status);
        }
        setDraggedTask(null);
        setDraggedOverColumn(null);
    };

    const DraggableTask = ({ task }) => {
        return (
            <Card
                draggable
                onDragStart={() => handleDragStart(task)}
                sx={{
                    padding: 2,
                    cursor: "pointer",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setViewTask(task);
                }}
            >
                <Typography variant="body1">{task[GlobalConstants.NAME]}</Typography>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">
                        {formatDate(task[GlobalConstants.START_TIME])}
                    </Typography>
                    {"-"}
                    <Typography variant="body2">
                        {formatDate(task[GlobalConstants.END_TIME])}
                    </Typography>
                </Stack>
            </Card>
        );
    };

    const updateViewTask = async (currentActionState, newTaskData) => {
        const updateTaskResult = await updateTaskById(
            viewTask[GlobalConstants.ID],
            currentActionState,
            newTaskData,
        );
        startTransition(() => fetchDbTasks());
        return updateTaskResult;
    };

    const DroppableColumn = ({ status, children }) => {
        return (
            <Paper
                elevation={3}
                onDragOver={(e) => {
                    e.preventDefault();
                    handleDragOver(status);
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
                <Stack spacing={2}>{children}</Stack>
            </Paper>
        );
    };

    return (
        <>
            {getFormActionMsg(taskActionState)}
            <Grid2 container spacing={2} columns={4}>
                {[
                    GlobalConstants.TO_DO,
                    GlobalConstants.IN_PROGRESS,
                    GlobalConstants.IN_REVIEW,
                    GlobalConstants.DONE,
                ].map((status) => (
                    <Grid2 size={1} key={status}>
                        <DroppableColumn status={status}>
                            {isTasksPending ? (
                                <CircularProgress />
                            ) : (
                                sortTasks(tasks.filter((task) => task.status === status)).map(
                                    (task) => (
                                        <DraggableTask key={task[GlobalConstants.ID]} task={task} />
                                    ),
                                )
                            )}
                        </DroppableColumn>
                    </Grid2>
                ))}
            </Grid2>
            <Dialog open={!!viewTask} onClose={() => setViewTask(null)}>
                <Form
                    name={GlobalConstants.TASK}
                    defaultValues={viewTask}
                    action={updateViewTask}
                    buttonLabel="save task"
                    readOnly={true}
                    editable={!readOnly}
                />
                {!readOnly && (
                    <Button color="error" onClick={deleteViewTask}>
                        delete
                    </Button>
                )}
            </Dialog>
        </>
    );
};

export default KanBanBoard;
