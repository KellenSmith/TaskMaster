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
import { CloseRounded, Edit, ExpandMore } from "@mui/icons-material";
import { updateEventTasks, geteventTasks } from "../../../lib/task-actions";
import { defaultActionState as defaultDatagridActionState } from "../../../ui/Datagrid";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { allowSelectMultiple, datePickerFields, RenderedFields } from "../../../ui/form/FieldCfg";

const testTaskOptions = [
    {
        id: 1,
        name: "task 1",
        phase: GlobalConstants.BEFORE,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        id: 2,
        name: "task 2",
        phase: GlobalConstants.BEFORE,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        id: 3,
        name: "task 3",
        phase: GlobalConstants.DURING,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        id: 4,
        name: "task 4",
        phase: GlobalConstants.DURING,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        id: 5,
        name: "task 5",
        phase: GlobalConstants.AFTER,
        startTime: dayjs().toISOString(),
        endTime: dayjs().add(1, "hour").toISOString(),
        description: "test description",
    },
    {
        id: 6,
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

    const taskAlreadyExists = (newTask: any) =>
        [...taskOptions, ...selectedTasks]
            .map((task) => task[GlobalConstants.NAME])
            .includes(newTask[GlobalConstants.NAME]);

    const loadDefaultTaskOptions = async () => {
        //const fetchedDefaultTasks = await geteventTasks(null, defaultDatagridActionState);
        //setTaskOptions(fetchedDefaultTasks.result);

        const defaultTimes = {
            [GlobalConstants.BEFORE]: {
                [GlobalConstants.START_TIME]: dayjs(event[GlobalConstants.START_TIME])
                    .subtract(7, "d")
                    .toISOString(),
                [GlobalConstants.END_TIME]: dayjs(event[GlobalConstants.START_TIME]).toISOString(),
            },
            [GlobalConstants.DURING]: {
                [GlobalConstants.START_TIME]: dayjs(
                    event[GlobalConstants.START_TIME],
                ).toISOString(),
                [GlobalConstants.END_TIME]: dayjs(event[GlobalConstants.END_TIME]).toISOString(),
            },
            [GlobalConstants.AFTER]: {
                [GlobalConstants.START_TIME]: dayjs(event[GlobalConstants.END_TIME]).toISOString(),
                [GlobalConstants.END_TIME]: dayjs(event[GlobalConstants.END_TIME])
                    .add(7, "d")
                    .toISOString(),
            },
        };

        const defaultTasks = testTaskOptions
            // Only load unique tasks
            .filter((task) => !taskAlreadyExists(task))
            // Remove id so copies can be created
            // eslint-disable-next-line no-unused-vars
            .map(({ id, ...rest }) => ({
                ...rest,
                ...defaultTimes[rest[GlobalConstants.PHASE]],
            }));
        defaultTasks.length > 0 && setTaskOptions([...taskOptions, ...defaultTasks]);
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
        if (taskAlreadyExists(newTask)) {
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

    const saveSelectedTasks = async () => {
        const saveTasksResult = await updateEventTasks(
            event[GlobalConstants.ID],
            defaultFormActionState,
            selectedTasks,
        );
        setTaskActionState(saveTasksResult);
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
                {isTaskSelected(task) ? (
                    <Button onClick={() => setViewTask(task)}>
                        <Edit />
                    </Button>
                ) : (
                    <Button onClick={() => deleteTaskFromOptions(task)}>
                        <CloseRounded />
                    </Button>
                )}
            </Stack>
        </Stack>
    );

    // Sort tasks within each phase by end time, then start time, then name
    const getSortedTasksForPhase = (phase: string) => {
        const tasksForPhase = [...selectedTasks, ...taskOptions].filter(
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
            <Dialog open={viewTask !== null} onClose={() => setViewTask(null)}>
                <Form
                    name={GlobalConstants.TASK}
                    action={
                        Object.keys(viewTask || {}).length === 0
                            ? addSelectedTask
                            : editSelectedTask
                    }
                    defaultValues={getTaskDefaultValues()}
                    buttonLabel={
                        Object.keys(viewTask || {}).length === 0 ? "add task" : "save task"
                    }
                />
            </Dialog>
        </>
    );
};

export default TaskDashboard;
