import {
    Button,
    Checkbox,
    Dialog,
    FormControlLabel,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import GlobalConstants from "../../../../GlobalConstants";
import { CloseRounded, RemoveRedEye } from "@mui/icons-material";
import { formatDate } from "../../../../ui/utils";
import { useUserContext } from "../../../../context/UserContext";
import Form from "../../../../ui/form/Form";
import { Prisma } from "@prisma/client";
import {
    allowSelectMultiple,
    datePickerFields,
    formatAssigneeOptions,
    RenderedFields,
} from "../../../../ui/form/FieldCfg";
import { FormActionState, isUserHost } from "../../../../lib/definitions";
import { useState } from "react";
import { isTaskSelected } from "../event-utils";

const TaskMenuOption = ({
    event,
    task,
    readOnly,
    selectedTasks,
    setSelectedTasks,
    setTaskOptions,
    activeMembers,
}) => {
    const { user } = useUserContext();
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const getTaskDefaultValues = () => {
        const defaultTask = { ...task };
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

    const editSelectedTask = async (
        currentActionState: FormActionState,
        newTaskValues: Prisma.TaskCreateInput,
    ) => {
        const newActionState = { ...currentActionState };
        if (!isTaskSelected(task, selectedTasks)) deleteTaskFromOptions();
        setSelectedTasks((prev) => [
            ...prev.filter(
                (selectedTask) => selectedTask[GlobalConstants.ID] !== task[GlobalConstants.ID],
            ),
            newTaskValues,
        ]);
        setEditDialogOpen(false);
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Edited task";
        return newActionState;
    };

    const deleteTaskFromOptions = () =>
        setTaskOptions((prev) => [
            ...prev.filter(
                (taskOption) => taskOption[GlobalConstants.ID] !== task[GlobalConstants.ID],
            ),
        ]);

    const toggleTask = () => {
        if (isTaskSelected(task, selectedTasks)) {
            setTaskOptions((prev) => [...prev, task]);
            setSelectedTasks((prev) => [
                ...prev.filter(
                    (selectedTask) => selectedTask[GlobalConstants.ID] !== task[GlobalConstants.ID],
                ),
            ]);
            return;
        }
        setSelectedTasks((prev) => [...prev, task]);
        deleteTaskFromOptions();
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
                                onChange={toggleTask}
                            />
                        }
                        label={task[GlobalConstants.NAME]}
                    />

                    <Stack direction="row">
                        {!readOnly && !isTaskSelected(task, selectedTasks) && (
                            <Tooltip title={"Delete task/shift"}>
                                <Button onClick={deleteTaskFromOptions}>
                                    <CloseRounded />
                                </Button>
                            </Tooltip>
                        )}
                        <Button onClick={() => setEditDialogOpen(true)}>
                            <RemoveRedEye />
                        </Button>
                    </Stack>
                </Stack>
                <Stack key="time" direction="row" justifyContent="space-between">
                    <Typography key="start" variant="body2">
                        {formatDate(task[GlobalConstants.START_TIME])}
                    </Typography>
                    <Typography key="end" variant="body2">
                        {formatDate(task[GlobalConstants.END_TIME])}
                    </Typography>
                </Stack>
            </Stack>
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <Form
                    name={GlobalConstants.TASK}
                    action={editSelectedTask}
                    defaultValues={getTaskDefaultValues()}
                    customOptions={Object.fromEntries(
                        [GlobalConstants.ASSIGNEE_ID, GlobalConstants.REVIEWER_ID].map(
                            (fieldId) => [fieldId, formatAssigneeOptions(activeMembers)],
                        ),
                    )}
                    buttonLabel="save task"
                    editable={isUserHost(user, event)}
                />
                <Button
                    onClick={() => {
                        toggleTask();
                        setEditDialogOpen(false);
                    }}
                >
                    {isTaskSelected(task, selectedTasks) ? "unselect" : "select"}
                </Button>
            </Dialog>
        </>
    );
};

export default TaskMenuOption;
