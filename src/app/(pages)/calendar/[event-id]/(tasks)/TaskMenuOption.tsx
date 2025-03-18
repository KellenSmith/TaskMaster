import { Button, Checkbox, Dialog, FormControlLabel, Stack, Typography } from "@mui/material";
import GlobalConstants from "../../../../GlobalConstants";
import { CloseRounded, RemoveRedEye } from "@mui/icons-material";
import { formatDate } from "../../../../ui/utils";
import { useUserContext } from "../../../../context/UserContext";
import Form, { FormActionState } from "../../../../ui/form/Form";
import { Prisma } from "@prisma/client";
import {
    allowSelectMultiple,
    datePickerFields,
    RenderedFields,
} from "../../../../ui/form/FieldCfg";
import { isUserHost } from "../../../../lib/definitions";
import { useState } from "react";
import { isTaskSelected } from "../event-utils";

const TaskMenuOption = ({
    event,
    task,
    readOnly,
    selectedTasks,
    setSelectedTasks,
    setTaskOptions,
}) => {
    const { user } = useUserContext();
    const [viewTask, setViewTask] = useState(null);

    const getTaskDefaultValues = () => {
        const defaultTask = viewTask || {};
        for (let fieldId of RenderedFields[GlobalConstants.TASK]) {
            if (!defaultTask[fieldId]) {
                if (fieldId === GlobalConstants.PHASE)
                    defaultTask[fieldId] = GlobalConstants.BEFORE;
                else if (allowSelectMultiple.includes(fieldId)) defaultTask[fieldId] = [];
                else if (datePickerFields.includes(fieldId)) defaultTask[fieldId] = event[fieldId];
                else defaultTask[fieldId] = "";
            }
        }
        return defaultTask;
    };

    const addSelectedTask = async (
        currentActionState: FormActionState,
        newTask: Prisma.TaskCreateInput,
    ) => {
        const newActionState = { ...currentActionState };
        setSelectedTasks((prev) => [...prev, newTask]);
        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = "Task added";
        return newActionState;
    };

    const editSelectedTask = async (
        currentActionState: FormActionState,
        newTaskValues: Prisma.TaskCreateInput,
    ) => {
        const newActionState = { ...currentActionState };
        setSelectedTasks((prev) => [
            ...prev.filter((task) => task[GlobalConstants.NAME] !== viewTask[GlobalConstants.NAME]),
            newTaskValues,
        ]);
        setViewTask(null);
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

    const toggleTask = (toggledTask: any) => {
        if (isTaskSelected(toggledTask, selectedTasks)) {
            setTaskOptions((prev) => [...prev, toggledTask]);
            setSelectedTasks((prev) => [
                ...prev.filter(
                    (selectedTask) =>
                        selectedTask[GlobalConstants.ID] !== toggledTask[GlobalConstants.ID],
                ),
            ]);
            return;
        }
        setSelectedTasks((prev) => [...prev, toggledTask]);
        deleteTaskFromOptions(toggledTask);
    };

    return (
        <>
            <Stack key={task[GlobalConstants.ID]}>
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
                                checked={isTaskSelected(task, selectedTasks)}
                                onChange={() => toggleTask(task)}
                            />
                        }
                        label={task[GlobalConstants.NAME]}
                    />

                    <Stack direction="row">
                        {!readOnly && !isTaskSelected(task, selectedTasks) && (
                            <Button onClick={() => deleteTaskFromOptions(task)}>
                                <CloseRounded />
                            </Button>
                        )}
                        <Button onClick={() => setViewTask(task)}>
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
            <Dialog open={!!viewTask} onClose={() => setViewTask(null)}>
                <Form
                    name={GlobalConstants.TASK}
                    action={
                        Object.keys(viewTask || {}).length === 0
                            ? addSelectedTask
                            : editSelectedTask
                    }
                    defaultValues={getTaskDefaultValues()}
                    buttonLabel="save task"
                    editable={isUserHost(user, event)}
                />
                {viewTask && (
                    <Button
                        onClick={() => {
                            toggleTask(viewTask);
                            setViewTask(null);
                        }}
                    >
                        {isTaskSelected(viewTask, selectedTasks) ? "unselect" : "select"}
                    </Button>
                )}
            </Dialog>
        </>
    );
};

export default TaskMenuOption;
