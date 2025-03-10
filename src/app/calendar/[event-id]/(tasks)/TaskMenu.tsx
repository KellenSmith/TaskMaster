"use client";

import {
    Accordion,
    AccordionSummary,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    FormControlLabel,
    FormGroup,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import Form, {
    defaultActionState as defaultFormActionState,
    FormActionState,
    getFormActionMsg,
} from "../../../ui/form/Form";
import GlobalConstants from "../../../GlobalConstants";
import { startTransition, useEffect, useState } from "react";
import { CloseRounded, Edit, ExpandMore, RemoveRedEye } from "@mui/icons-material";
import { updateEventTasks, assignTasksToUser } from "../../../lib/task-actions";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { allowSelectMultiple, datePickerFields, RenderedFields } from "../../../ui/form/FieldCfg";
import { useUserContext } from "../../../context/UserContext";
import SwishPaymentHandler from "../../../ui/swish/SwishPaymentHandler";
import { OrgSettings } from "../../../lib/org-settings";
import { isUserParticipant, sortTasks } from "../event-utils";
import { formatDate } from "../../../ui/utils";

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

const TaskMenu = ({
    event,
    fetchEventAction,
    readOnly,
    tasks,
    fetchTasksAction,
    isTasksPending,
}) => {
    const theme = useTheme();
    const { user } = useUserContext();
    const [taskOptions, setTaskOptions] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [viewTask, setViewTask] = useState(null);
    const [taskActionState, setTaskActionState] = useState(defaultFormActionState);
    const [paymentHandlerOpen, setPaymentHandlerOpen] = useState(false);

    useEffect(() => {
        if (readOnly) {
            setTaskOptions(
                tasks.filter(
                    (task) => task[GlobalConstants.ASSIGNEE_ID] !== user[GlobalConstants.ID],
                ),
            );
            setSelectedTasks(
                tasks.filter(
                    (task) => task[GlobalConstants.ASSIGNEE_ID] === user[GlobalConstants.ID],
                ),
            );
        } else setSelectedTasks(tasks);
    }, [readOnly, tasks, user]);

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

    const getReducedTicketPrice = () => {
        const fullPrice = event[GlobalConstants.FULL_TICKET_PRICE];
        const nTasks = selectedTasks.length;
        const reducedTicketPrice =
            (1 -
                Math.min(
                    1,
                    nTasks * (1 / (OrgSettings[GlobalConstants.FULL_EVENT_TASK_BURDEN] as number)),
                )) *
            fullPrice;
        return Math.round(reducedTicketPrice);
    };

    const hasBoughtTicket = async (): Promise<boolean> => {
        startTransition(() => {
            fetchEventAction();
        });
        return isUserParticipant(user, event);
    };

    const assignSelectedTasks = async () => {
        const assignResult = await assignTasksToUser(
            user[GlobalConstants.ID],
            selectedTasks.map((task) => task[GlobalConstants.ID]),
            defaultFormActionState,
        );
        setTaskActionState(assignResult);
        startTransition(() => fetchTasksAction());
    };

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
        startTransition(() => fetchTasksAction());
        setTaskActionState(saveTasksResult);
    };

    const deleteTaskFromOptions = (task: any) =>
        setTaskOptions((prev) => [
            ...prev.filter(
                (taskOption) => taskOption[GlobalConstants.NAME] !== task[GlobalConstants.NAME],
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

    const getTaskComp = (task: any) => (
        <Stack key={task[GlobalConstants.ID] || task[GlobalConstants.NAME]}>
            <Stack key="title" direction="row" justifyContent="space-between" alignItems="center">
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
                    {readOnly ? (
                        <Button onClick={() => setViewTask(task)}>
                            <RemoveRedEye />
                        </Button>
                    ) : isTaskSelected(task) ? (
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
    );

    // Sort tasks within each phase by end time, then start time, then name
    const getSortedTasksForPhase = (phase: string) => {
        const tasksForPhase = [...selectedTasks, ...taskOptions].filter(
            (task) => task[GlobalConstants.PHASE] === phase,
        );
        return sortTasks(tasksForPhase);
    };

    return (
        <>
            <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                    <Stack spacing={2} width="100%">
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
                                    {isTasksPending ? (
                                        <CircularProgress />
                                    ) : (
                                        getSortedTasksForPhase(phase).map((task) =>
                                            getTaskComp(task),
                                        )
                                    )}
                                </FormGroup>
                            </Accordion>
                        ))}
                    </Stack>
                    {readOnly && (
                        <Stack component={Paper} spacing={2} width="100%">
                            <Typography variant="h6" color={theme.palette.primary.main}>
                                My tasks
                            </Typography>
                            {sortTasks(selectedTasks).map((task) => getTaskComp(task))}
                            <Typography>
                                {selectedTasks.length < 1
                                    ? "Sign up for tasks or volunteer shifts to reduce your ticket price!"
                                    : `Thanks for helping out! Your ticket price is ${getReducedTicketPrice()} SEK`}
                            </Typography>
                        </Stack>
                    )}
                </Stack>
                {getFormActionMsg(taskActionState)}

                {!readOnly ? (
                    <Stack spacing={2}>
                        <Button onClick={loadDefaultTaskOptions}>load default tasks</Button>
                        <Button onClick={() => setViewTask({})}>add task</Button>
                        <Button onClick={saveSelectedTasks}>save tasks</Button>
                    </Stack>
                ) : isUserParticipant(user, event) ? (
                    <Button onClick={assignSelectedTasks}>assign tasks to me</Button>
                ) : (
                    <Button onClick={() => setPaymentHandlerOpen(true)}>buy ticket</Button>
                )}
            </Stack>
            <Dialog open={!!viewTask} onClose={() => setViewTask(null)}>
                <Form
                    name={GlobalConstants.TASK}
                    readOnly={readOnly}
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
                {viewTask && readOnly && (
                    <Button
                        onClick={() => {
                            toggleTask(viewTask);
                            setViewTask(null);
                        }}
                    >
                        {isTaskSelected(viewTask) ? "unselect" : "select"}
                    </Button>
                )}
            </Dialog>
            <SwishPaymentHandler
                title="Buy ticket"
                open={paymentHandlerOpen}
                setOpen={setPaymentHandlerOpen}
                hasPaid={hasBoughtTicket}
                paymentAmount={getReducedTicketPrice()}
                callbackEndpoint="buy-event-ticket"
                callbackParams={
                    new URLSearchParams([
                        [GlobalConstants.USER_ID, user[GlobalConstants.ID]],
                        [GlobalConstants.EVENT_ID, event ? event[GlobalConstants.ID] : ""],
                        ...selectedTasks.map((task) => [
                            GlobalConstants.TASK_ID,
                            task[GlobalConstants.ID],
                        ]),
                    ])
                }
            />
        </>
    );
};

export default TaskMenu;
