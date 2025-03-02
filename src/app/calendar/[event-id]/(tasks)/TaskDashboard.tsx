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
} from "@mui/material";
import Form, {
    defaultActionState as defaultFormActionState,
    FormActionState,
    getFormActionMsg,
} from "../../../ui/form/Form";
import GlobalConstants from "../../../GlobalConstants";
import { useCallback, useEffect, useState } from "react";
import { CloseRounded, ExpandMore, RemoveRedEye } from "@mui/icons-material";
import { createTasks, geteventTasks } from "../../../lib/task-actions";
import { defaultActionState as defaultDatagridActionState } from "../../../ui/Datagrid";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";

const testTaskOptions = [
    { id: "1", name: "task 1", phase: GlobalConstants.BEFORE },
    { id: "2", name: "task 2", phase: GlobalConstants.BEFORE },
    { id: "3", name: "task 3", phase: GlobalConstants.DURING },
    { id: "4", name: "task 4", phase: GlobalConstants.DURING },
    { id: "5", name: "task 5", phase: GlobalConstants.AFTER },
    { id: "6", name: "task 6", phase: GlobalConstants.AFTER },
];

const TaskDashboard = ({ event }) => {
    const [taskOptions, setTaskOptions] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [viewTask, setViewTask] = useState(null);
    const [taskActionState, setTaskActionState] = useState(defaultFormActionState);

    const loadTaskOptions = async () => {
        //const fetchedDefaultTasks = await geteventTasks(null, defaultDatagridActionState);
        //setTaskOptions(fetchedDefaultTasks.result);
        setTaskOptions(testTaskOptions);
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

    const getTaskDefaultValues = () => {
        const task = viewTask || {};
        return {
            [GlobalConstants.NAME]: task[GlobalConstants.NAME] || "",
            [GlobalConstants.PHASE]: task[GlobalConstants.PHASE] || GlobalConstants.BEFORE,
            [GlobalConstants.START_TIME]: task[GlobalConstants.START_TIME] || dayjs().toISOString(),
            [GlobalConstants.END_TIME]: task[GlobalConstants.END_TIME] || dayjs().toISOString(),
            [GlobalConstants.DESCRIPTION]: task[GlobalConstants.DESCRIPTION] || "",
        };
    };

    const deleteTaskFromOptions = (task: any) =>
        setTaskOptions((prev) => [
            ...prev.filter(
                (taskOption) => taskOption[GlobalConstants.ID] !== task[GlobalConstants.ID],
            ),
        ]);

    const addSelectedTask = async (
        currentActionState: FormActionState,
        newTask: Prisma.TaskCreateInput,
    ) => {
        const newActionState = { ...currentActionState };
        try {
            setSelectedTasks((prev) => [...prev, newTask]);
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

    const saveSelectedTasks = async () => {
        const saveTasksResult = await createTasks(
            event[GlobalConstants.ID],
            defaultFormActionState,
            selectedTasks,
        );
        setTaskActionState(saveTasksResult);
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
        <Stack key={task[GlobalConstants.NAME]} direction="row" justifyContent="space-between">
            <FormControlLabel
                control={
                    <Checkbox checked={isTaskSelected(task)} onChange={() => toggleTask(task)} />
                }
                label={task[GlobalConstants.NAME]}
            />
            <Stack direction="row">
                {!isTaskSelected(task) && (
                    <Button onClick={() => deleteTaskFromOptions(task)}>
                        <CloseRounded />
                    </Button>
                )}
                <Button onClick={() => setViewTask(task)}>
                    <RemoveRedEye />
                </Button>
            </Stack>
        </Stack>
    );

    return (
        <>
            <Stack spacing={2}>
                {[GlobalConstants.BEFORE, GlobalConstants.DURING, GlobalConstants.AFTER].map(
                    (phase) => (
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
                    ),
                )}
                {getFormActionMsg(taskActionState)}

                <Button onClick={loadTaskOptions}>load default tasks</Button>
                <Button onClick={() => setViewTask({})}>add task</Button>
                <Button onClick={saveSelectedTasks}>save tasks</Button>
            </Stack>
            <Dialog open={viewTask} onClose={() => setViewTask(null)}>
                <Form
                    name={GlobalConstants.TASK}
                    action={addSelectedTask}
                    defaultValues={getTaskDefaultValues()}
                    buttonLabel="add task"
                />
            </Dialog>
        </>
    );
};

export default TaskDashboard;
