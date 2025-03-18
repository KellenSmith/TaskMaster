"use client";

import React, { startTransition, useState } from "react";
import { CircularProgress, Dialog, Grid2 } from "@mui/material";
import { deleteTask, updateTaskById } from "../../lib/task-actions";
import GlobalConstants from "../../GlobalConstants";
import Form, { defaultActionState, getFormActionMsg } from "../form/Form";
import { sortTasks } from "../../(pages)/calendar/[event-id]/event-utils";
import ConfirmButton from "../ConfirmButton";
import DraggableTask from "./DraggableTask";
import DroppableColumn from "./DroppableColumn";

const KanBanBoard = ({ tasks, fetchDbTasks, isTasksPending, readOnly = true }) => {
    const [viewTask, setViewTask] = useState(null);
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const [taskActionState, setTaskActionState] = useState(defaultActionState);

    const deleteViewTask = async () => {
        const deleteTaskResult = await deleteTask(viewTask[GlobalConstants.ID], taskActionState);
        startTransition(() => fetchDbTasks());
        setTaskActionState(deleteTaskResult);
        setViewTask(null);
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
                        <DroppableColumn
                            status={status}
                            draggedOverColumn={draggedOverColumn}
                            setDraggedOverColumn={setDraggedOverColumn}
                            draggedTask={draggedTask}
                            setDraggedTask={setDraggedTask}
                            fetchDbTasks={fetchDbTasks}
                            setTaskActionState={setTaskActionState}
                        >
                            {isTasksPending ? (
                                <CircularProgress />
                            ) : (
                                sortTasks(tasks.filter((task) => task.status === status)).map(
                                    (task) => (
                                        <DraggableTask
                                            key={task[GlobalConstants.ID]}
                                            task={task}
                                            setDraggedTask={setDraggedTask}
                                            setViewTask={setViewTask}
                                        />
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
                    <ConfirmButton color="error" onClick={deleteViewTask}>
                        delete
                    </ConfirmButton>
                )}
            </Dialog>
        </>
    );
};

export default KanBanBoard;
