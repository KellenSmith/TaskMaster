import { Button, Checkbox, Dialog, FormControlLabel, Stack, Typography } from "@mui/material";
import GlobalConstants from "../../../../GlobalConstants";
import { CloseRounded, RemoveRedEye } from "@mui/icons-material";
import { formatDate } from "../../../../ui/utils";
import { useUserContext } from "../../../../context/UserContext";
import Form, { FormActionState } from "../../../../ui/form/Form";
import { Prisma } from "@prisma/client";
import { isUserHost } from "../../../../lib/definitions";
import { useState } from "react";

const TaskMenuOption = ({
    event,
    task,
    readOnly,
    selectedTasks,
    setSelectedTasks,
    setTaskOptions,
}) => {
    const { user } = useUserContext();
    const [dialogOpen, setDialogOpen] = useState(false);

    const editSelectedTask = async (
        currentActionState: FormActionState,
        newTaskValues: Prisma.TaskCreateInput,
    ) => {
        const newActionState = { ...currentActionState };
        setSelectedTasks((prev) => [
            ...prev.filter(
                (selectedTask) => selectedTask[GlobalConstants.ID] !== task[GlobalConstants.ID],
            ),
            newTaskValues,
        ]);
        setDialogOpen(false);
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Edited task";
        return newActionState;
    };

    const deleteTaskFromOptions = (task: any) =>
        setTaskOptions((prev) => [
            ...prev.filter(
                (taskOption) => taskOption[GlobalConstants.ID] !== task[GlobalConstants.ID],
            ),
        ]);

    const isTaskSelected = (task: any) =>
        selectedTasks
            .map((task) => task[GlobalConstants.NAME])
            .includes(task[GlobalConstants.NAME]) ||
        task[GlobalConstants.ASSIGNEE_ID] === user[GlobalConstants.ID];

    const toggleTask = (toggledTask: any) => {
        if (isTaskSelected(toggledTask)) {
            setTaskOptions((prev) => [...prev, toggledTask]);
            setSelectedTasks((prev) => [
                ...prev.filter((selectedTask) => {
                    return selectedTask[GlobalConstants.NAME] !== toggledTask[GlobalConstants.NAME];
                }),
            ]);
            return;
        }
        setSelectedTasks((prev) => [...prev, toggledTask]);
        deleteTaskFromOptions(toggledTask);
    };

    return (
        <>
            <Stack key={task[GlobalConstants.ID] || task[GlobalConstants.NAME]}>
                <Stack
                    key="title"
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                disabled={
                                    task[GlobalConstants.ASSIGNEE_ID] === user[GlobalConstants.ID]
                                }
                                checked={isTaskSelected(task)}
                                onChange={() => toggleTask(task)}
                            />
                        }
                        label={task[GlobalConstants.NAME]}
                    />

                    <Stack direction="row">
                        {!readOnly && !isTaskSelected(task) && (
                            <Button onClick={() => deleteTaskFromOptions(task)}>
                                <CloseRounded />
                            </Button>
                        )}
                        <Button onClick={() => setDialogOpen(true)}>
                            <RemoveRedEye />
                        </Button>
                    </Stack>
                </Stack>
                <Stack key="time" direction="row" justifyContent="space-between">
                    <Typography key="start" variant="body2">
                        {formatDate(task[GlobalConstants.START_TIME])}
                    </Typography>
                    {"-"}
                    <Typography key="end" variant="body2">
                        {formatDate(task[GlobalConstants.END_TIME])}
                    </Typography>
                </Stack>
            </Stack>
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <Form
                    name={GlobalConstants.TASK}
                    action={editSelectedTask}
                    defaultValues={task}
                    buttonLabel="save task"
                    editable={isUserHost(user, event)}
                />
                <Button
                    onClick={() => {
                        toggleTask(task);
                        setDialogOpen(false);
                    }}
                >
                    {isTaskSelected(task) ? "unselect" : "select"}
                </Button>
            </Dialog>
        </>
    );
};

export default TaskMenuOption;
