"use ";

import React, { startTransition, useCallback, useEffect, useState } from "react";
import { Card, Dialog, Grid2, Paper, Stack, Typography, useTheme } from "@mui/material";
import dayjs from "dayjs";
import GlobalConstants from "../../../GlobalConstants";
import { sortTasks } from "./TaskDashboard";
import Form, { defaultActionState, getFormActionMsg } from "../../../ui/form/Form";
import { geteventTasks, updateTaskById } from "../../../lib/task-actions";
import { useUserContext } from "../../../context/UserContext";
import { defaultActionState as defaultDatagridActionState } from "../../../ui/Datagrid";

const TaskKanBanBoard = ({ event }) => {
    const theme = useTheme();
    const { user } = useUserContext();
    const [tasks, setTasks] = useState([]);
    const [viewTask, setViewTask] = useState(null);
    const [taskActionState, setTaskActionState] = useState(defaultActionState);
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);

    const loadTasks = useCallback(async () => {
        const fetchedEventTasks = await geteventTasks(
            event[GlobalConstants.ID],
            defaultDatagridActionState,
        );
        setTasks(fetchedEventTasks.result);
    }, [event]);

    useEffect(() => {
        if (event) {
            loadTasks();
        }
    }, [event, loadTasks]);

    const updateTaskStatus = async (task, status) => {
        const updateTaskResult = await updateTaskById(
            task[GlobalConstants.ID],
            defaultActionState,
            { [GlobalConstants.STATUS]: status },
        );
        startTransition(() => loadTasks());
        setTaskActionState(updateTaskResult);
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
                        {dayjs(task[GlobalConstants.START_TIME]).format("L HH:MM")}
                    </Typography>
                    {"-"}
                    <Typography variant="body2">
                        {dayjs(task[GlobalConstants.END_TIME]).format("L HH:MM")}
                    </Typography>
                </Stack>
            </Card>
        );
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
                            {sortTasks(tasks.filter((task) => task.status === status)).map(
                                (task) => (
                                    <DraggableTask key={task[GlobalConstants.ID]} task={task} />
                                ),
                            )}
                        </DroppableColumn>
                    </Grid2>
                ))}
            </Grid2>
            <Dialog open={!!viewTask} onClose={() => setViewTask(null)}>
                <Form name={GlobalConstants.TASK} readOnly={true} defaultValues={viewTask} />
            </Dialog>
        </>
    );
};

export default TaskKanBanBoard;
