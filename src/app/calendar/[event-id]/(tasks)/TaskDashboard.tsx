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
import { useCallback, useEffect, useRef, useState } from "react";
import { CloseRounded, ExpandMore, RemoveRedEye } from "@mui/icons-material";
import { createTasks, geteventTasks } from "../../../lib/task-actions";
import { defaultActionState as defaultDatagridActionState } from "../../../ui/Datagrid";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";

const testTaskOptions = [
    {
        name: "task 1",
        phase: GlobalConstants.BEFORE,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        name: "task 2",
        phase: GlobalConstants.BEFORE,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        name: "task 3",
        phase: GlobalConstants.DURING,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        name: "task 4",
        phase: GlobalConstants.DURING,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        name: "task 5",
        phase: GlobalConstants.AFTER,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        name: "task 6",
        phase: GlobalConstants.AFTER,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
];

const TaskDashboard = ({ event }) => {
    const hasLoadedTasks = useRef(false);
    const [taskOptions, setTaskOptions] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [viewTask, setViewTask] = useState(null);
    const [taskActionState, setTaskActionState] = useState(defaultFormActionState);

    const loadDefaultTaskOptions = async () => {
        //const fetchedDefaultTasks = await geteventTasks(null, defaultDatagridActionState);
        //setTaskOptions(fetchedDefaultTasks.result);
        setTaskOptions(testTaskOptions);
    };

    const loadSelectedTasks = useCallback(async () => {
        const fetchedEventTasks = await geteventTasks(
            event[GlobalConstants.ID],
            defaultDatagridActionState,
        );
        setSelectedTasks((prev) => [...prev, ...fetchedEventTasks.result]);
    }, [event]);

    useEffect(() => {
        if (event && !hasLoadedTasks.current) {
            hasLoadedTasks.current = true;
            loadSelectedTasks();
        }
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
                (taskOption) => taskOption[GlobalConstants.NAME] !== task[GlobalConstants.NAME],
            ),
        ]);

    const addSelectedTask = async (
        currentActionState: FormActionState,
        newTask: Prisma.TaskCreateInput,
    ) => {
        const newActionState = { ...currentActionState };
        // Ensure only one copy of a task can be added for an event
        const taskAlreadyExists = [...taskOptions, ...selectedTasks]
            .map((task) => task[GlobalConstants.NAME])
            .includes(newTask[GlobalConstants.NAME]);
        if (taskAlreadyExists) {
            newActionState.status = 500;
            newActionState.errorMsg = "Task already exists";
            newActionState.result = "";
        } else {
            setSelectedTasks((prev) => [...prev, newTask]);
            newActionState.errorMsg = "";
            newActionState.status = 201;
            newActionState.result = "Task added";
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
        loadSelectedTasks();
    };

    const isTaskSelected = (task: any) =>
        selectedTasks
            .map((task) => task[GlobalConstants.NAME])
            .includes(task[GlobalConstants.NAME]);

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

    const getTaskComp = (task: any) => (
        <Stack
            key={task[GlobalConstants.ID] || task[GlobalConstants.NAME]}
            direction="row"
            justifyContent="space-between"
        >
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

    // Sort tasks within each phase by end time, then start time, then name
    const getSortedTasksForPhase = (phase: string) => {
        const tasksForPhase = [...taskOptions, ...selectedTasks].filter(
            (task) => task[GlobalConstants.PHASE] === phase,
        );
        return tasksForPhase.sort((taska, taskb) => {
            if (
                dayjs(taska[GlobalConstants.END_TIME]).isSame(
                    dayjs(taskb[GlobalConstants.END_TIME]),
                    "minute",
                )
            ) {
                if (
                    dayjs(taska[GlobalConstants.START_TIME]).isSame(
                        dayjs(taskb[GlobalConstants.START_TIME]),
                        "minute",
                    )
                )
                    return taska[GlobalConstants.NAME].localeCompare(taskb[GlobalConstants.NAME]);
                return dayjs(taska[GlobalConstants.START_TIME]).isBefore(
                    dayjs(taskb[GlobalConstants.START_TIME]),
                );
            }
            return dayjs(taska[GlobalConstants.END_TIME]).isBefore(
                dayjs(taskb[GlobalConstants.END_TIME]),
            );
        });
    };

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
                                {getSortedTasksForPhase(phase).map((task) => getTaskComp(task))}
                            </FormGroup>
                        </Accordion>
                    ),
                )}
                {getFormActionMsg(taskActionState)}

                <Button onClick={loadDefaultTaskOptions}>load default tasks</Button>
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
