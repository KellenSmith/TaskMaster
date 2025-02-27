"use client";

import {
    Accordion,
    AccordionSummary,
    Button,
    Checkbox,
    Dialog,
    FormControlLabel,
    FormGroup,
    Stack,
    Tab,
    Tabs,
} from "@mui/material";
import Form, { FormActionState } from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CloseRounded, ExpandMore, RemoveRedEye } from "@mui/icons-material";
import { isUserAdmin, isUserHost } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import { geteventTasks } from "../../lib/task-actions";
import { defaultActionState as defaultDatagridActionState } from "../../ui/Datagrid";
import { getStrippedFormData } from "../../lib/action-utils";
import { createTaskSchema } from "../../lib/zod-schemas";

const testTaskOptions = [
    { id: "1", name: "task 1", phase: GlobalConstants.BEFORE },
    { id: "2", name: "task 2", phase: GlobalConstants.BEFORE },
    { id: "3", name: "task 3", phase: GlobalConstants.DURING },
    { id: "4", name: "task 4", phase: GlobalConstants.DURING },
    { id: "5", name: "task 5", phase: GlobalConstants.AFTER },
    { id: "6", name: "task 6", phase: GlobalConstants.AFTER },
];

const EventDashboard = ({ event, saveEventAction }) => {
    const { user } = useUserContext();
    const tabs = useMemo(() => ({ event: "Event", tasks: "Tasks" }), []);
    const [openTab, setTab] = useState(tabs.event);
    const [taskOptions, setTaskOptions] = useState(testTaskOptions);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [viewTask, setViewTask] = useState(null);

    const loadTaskOptions = async () => {
        const fetchedDefaultTasks = await geteventTasks(null, defaultDatagridActionState);
        setTaskOptions(fetchedDefaultTasks.result);
    };

    const loadSelectedTasks = useCallback(async () => {
        const fetchedEventTasks = await geteventTasks(
            event[GlobalConstants.ID],
            defaultDatagridActionState,
        );
        setSelectedTasks(fetchedEventTasks.result);
    }, [event]);

    useEffect(() => {
        if (event) loadSelectedTasks();
    }, [event, loadSelectedTasks]);

    const deleteTaskFromOptions = (task: any) =>
        setTaskOptions((prev) => [
            ...prev.filter(
                (taskOption) => taskOption[GlobalConstants.ID] !== task[GlobalConstants.ID],
            ),
        ]);

    const addSelectedTask = async (currentActionState: FormActionState, formData: FormData) => {
        const newActionState = { ...currentActionState };
        formData.append(GlobalConstants.EVENT_ID, event[GlobalConstants.ID]);
        try {
            const taskData = getStrippedFormData(formData, createTaskSchema);
            console.log(taskData);
            setSelectedTasks((prev) => [...prev, taskData]);
            newActionState.errorMsg = "";
            newActionState.status = 201;
            newActionState.result = "Task added";
        } catch (error) {
            newActionState.status = 500;
            newActionState.errorMsg = error.message;
            newActionState.result = "";
        }
        return newActionState;
    };

    const isTaskSelected = (task: any) =>
        selectedTasks.map((task) => task[GlobalConstants.ID]).includes(task[GlobalConstants.ID]);

    const toggleTask = (toggledTask: any) => {
        if (isTaskSelected(toggledTask)) {
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

    const getTaskComp = (task: any) => (
        <Stack key={task[GlobalConstants.ID]} direction="row" justifyContent="space-between">
            <FormControlLabel
                control={
                    <Checkbox checked={isTaskSelected(task)} onChange={() => toggleTask(task)} />
                }
                label={task[GlobalConstants.NAME]}
            />
            <Stack direction="row">
                <Button onClick={() => setViewTask(task)}>
                    <RemoveRedEye />
                </Button>
                {!isTaskSelected(task) && (
                    <Button onClick={() => deleteTaskFromOptions(task)}>
                        <CloseRounded />
                    </Button>
                )}
            </Stack>
        </Stack>
    );

    return (
        <>
            <Stack>
                <Tabs value={openTab} onChange={(_, newTab) => setTab(newTab)}>
                    {Object.keys(tabs).map((tab) => (
                        <Tab key={tabs[tab]} value={tabs[tab]} label={tabs[tab]} />
                    ))}
                </Tabs>
                {openTab === tabs.event && (
                    <Form
                        name={GlobalConstants.EVENT}
                        buttonLabel="save"
                        action={saveEventAction}
                        defaultValues={event}
                        readOnly={!(isUserAdmin(user) || isUserHost(user, event))}
                    />
                )}
                {openTab === tabs.tasks && (
                    <Stack spacing={2}>
                        {[
                            GlobalConstants.BEFORE,
                            GlobalConstants.DURING,
                            GlobalConstants.AFTER,
                        ].map((phase) => (
                            <Accordion key={phase}>
                                <AccordionSummary
                                    sx={{ textTransform: "capitalize" }}
                                    expandIcon={<ExpandMore />}
                                >
                                    {phase}
                                </AccordionSummary>
                                <FormGroup>
                                    {[...taskOptions, ...selectedTasks]
                                        .sort((taska, taskb) =>
                                            taska[GlobalConstants.NAME].localeCompare(
                                                taskb[GlobalConstants.NAME],
                                            ),
                                        )
                                        .filter((task) => task[GlobalConstants.PHASE] === phase)
                                        .map((task) => getTaskComp(task))}
                                </FormGroup>
                            </Accordion>
                        ))}
                        <Button onClick={() => setViewTask({})}>add task</Button>
                        <Button onClick={() => {}}>save tasks</Button>
                        <Button onClick={loadTaskOptions}>load default tasks</Button>
                    </Stack>
                )}
            </Stack>
            <Dialog open={viewTask} onClose={() => setViewTask(null)}>
                <Form
                    name={GlobalConstants.TASK}
                    action={addSelectedTask}
                    defaultValues={viewTask}
                    buttonLabel="add task"
                />
            </Dialog>
        </>
    );
};
export default EventDashboard;
