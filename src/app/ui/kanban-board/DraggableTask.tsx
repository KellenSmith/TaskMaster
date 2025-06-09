import { Button, Card, Dialog, Stack, Typography } from "@mui/material";
import { formatDate } from "../utils";
import GlobalConstants from "../../GlobalConstants";
import { assignTasksToUser, deleteTask, updateTaskById } from "../../lib/task-actions";
import Form, { defaultActionState } from "../form/Form";
import { startTransition, useState } from "react";
import ConfirmButton from "../ConfirmButton";
import { useUserContext } from "../../context/UserContext";
import { formatAssigneeOptions } from "../form/FieldCfg";

const DraggableTask = ({
    task,
    setDraggedTask,
    fetchDbTasks,
    readOnly,
    taskActionState,
    setTaskActionState,
    activeMembers,
}) => {
    const { user } = useUserContext();
    const [dialogOpen, setDialogOpen] = useState(false);

    const deleteViewTask = async () => {
        const deleteTaskResult = await deleteTask(task[GlobalConstants.ID], taskActionState);
        startTransition(() => fetchDbTasks());
        setTaskActionState(deleteTaskResult);
        setDialogOpen(false);
    };

    const updateViewTask = async (currentActionState, newTaskData) => {
        const updateTaskResult = await updateTaskById(
            task[GlobalConstants.ID],
            currentActionState,
            newTaskData,
        );
        startTransition(() => fetchDbTasks());
        return updateTaskResult;
    };

    const assignTaskToMe = async () => {
        const assignTasksResult = await assignTasksToUser(
            user[GlobalConstants.ID],
            [task[GlobalConstants.ID]],
            defaultActionState,
        );
        startTransition(() => fetchDbTasks());
        setTaskActionState(assignTasksResult);
    };

    const getTaskDefaultValues = () => {
        const defaultValues = { ...task };

        return defaultValues;
    };

    return (
        <>
            <Card
                draggable
                onDragStart={() => setDraggedTask(task)}
                sx={{
                    padding: 2,
                    cursor: "pointer",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setDialogOpen(true);
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
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <Form
                    name={GlobalConstants.TASK}
                    defaultValues={getTaskDefaultValues()}
                    customOptions={Object.fromEntries(
                        [GlobalConstants.ASSIGNEE_ID, GlobalConstants.REPORTER_ID].map(
                            (fieldId) => [fieldId, formatAssigneeOptions(activeMembers)],
                        ),
                    )}
                    action={updateViewTask}
                    buttonLabel="save task"
                    readOnly={true}
                    editable={!readOnly}
                />
                <Button
                    onClick={assignTaskToMe}
                    disabled={task[GlobalConstants.ASSIGNEE_ID] === user[GlobalConstants.ID]}
                >
                    {task[GlobalConstants.ASSIGNEE_ID] === user[GlobalConstants.ID]
                        ? "This task is assigned to you"
                        : "Assign to me"}
                </Button>
                {!readOnly && (
                    <ConfirmButton color="error" onClick={deleteViewTask}>
                        delete
                    </ConfirmButton>
                )}
            </Dialog>
        </>
    );
};

export default DraggableTask;
