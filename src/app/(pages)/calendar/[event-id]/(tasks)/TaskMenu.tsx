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
    getFormActionMsg,
    defaultActionState as defaultFormActionState,
    FormActionState,
} from "../../../../ui/form/Form";
import GlobalConstants from "../../../../GlobalConstants";
import { startTransition, useEffect, useMemo, useState } from "react";
import { ExpandMore } from "@mui/icons-material";
import { updateEventTasks, assignTasksToUser } from "../../../../lib/task-actions";
import dayjs from "dayjs";
import { useUserContext } from "../../../../context/UserContext";
import SwishPaymentHandler from "../../../../ui/swish/SwishPaymentHandler";
import { OrgSettings } from "../../../../lib/org-settings";
import { isUserParticipant, sortTasks } from "../event-utils";
import TaskMenuOption from "./TaskMenuOption";
import { isUserHost } from "../../../../lib/definitions";

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
    const [addTask, setAddTask] = useState(null);
    const [taskActionState, setTaskActionState] = useState(defaultFormActionState);
    const [paymentHandlerOpen, setPaymentHandlerOpen] = useState(false);

    const taskDefaultTimes = useMemo(
        () => ({
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
        }),
        [event],
    );

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

        const defaultTasks = testTaskOptions
            // Only load unique tasks
            .filter((task) => !taskAlreadyExists(task))
            // Remove id so copies can be created
            // eslint-disable-next-line no-unused-vars
            .map(({ id, ...rest }) => ({
                ...rest,
                ...taskDefaultTimes[rest[GlobalConstants.PHASE]],
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

    const saveSelectedTasks = async () => {
        const saveTasksResult = await updateEventTasks(
            event[GlobalConstants.ID],
            defaultFormActionState,
            selectedTasks,
        );
        startTransition(() => fetchTasksAction());
        setTaskActionState(saveTasksResult);
    };

    // Sort tasks within each phase by end time, then start time, then name
    const getSortedTasksForPhase = (phase: string) => {
        const tasksForPhase = [...selectedTasks, ...taskOptions].filter(
            (task) => task[GlobalConstants.PHASE] === phase,
        );
        return sortTasks(tasksForPhase);
    };

    const getUniqueTaskNamesForPhase = (phase) => {
        const sortedTasksForPhase = sortTasks(
            [...selectedTasks, ...taskOptions].filter(
                (task) => task[GlobalConstants.PHASE] === phase,
            ),
        );
        const uniqueTaskNames = [];
        for (let task of sortedTasksForPhase) {
            if (!uniqueTaskNames.includes(task[GlobalConstants.NAME]))
                uniqueTaskNames.push(task[GlobalConstants.NAME]);
        }
        return uniqueTaskNames;
    };

    const toggleAllTasksForPhase = (phase) => {
        const selectedPhaseTasks = selectedTasks.filter(
            (task) => task[GlobalConstants.PHASE] === phase,
        );
        const phaseTaskOptions = taskOptions.filter(
            (task) => task[GlobalConstants.PHASE] === phase,
        );
        if (phaseTaskOptions.length > 0) {
            setSelectedTasks((prev) => [...prev, ...phaseTaskOptions]);
            setTaskOptions((prev) => prev.filter((task) => task[GlobalConstants.PHASE] !== phase));
        } else {
            setTaskOptions((prev) => [...prev, ...selectedPhaseTasks]);
            setSelectedTasks((prev) =>
                prev.filter((task) => task[GlobalConstants.PHASE] !== phase),
            );
        }
    };

    const openAddTask = (phase) => {
        const defaultTask = {
            [GlobalConstants.ID]:
                tasks
                    .map((task) => task[GlobalConstants.ID])
                    .sort((taskId1: string, taskId2: string) => taskId1.localeCompare(taskId2))
                    .at(-1) + "+",
            [GlobalConstants.PHASE]: phase,
            ...taskDefaultTimes[phase],
        };
        setAddTask(defaultTask);
    };

    const addNewTask = async (
        currentActionState: FormActionState,
        fieldValues: any,
    ): Promise<FormActionState> => {
        setSelectedTasks((prev) => [...prev, fieldValues]);
        setAddTask(null);
        return currentActionState;
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
                                    sx={{
                                        textTransform: "capitalize",
                                        justifyContent: "space-between",
                                        "&.MuiAccordionSummary-content": { alignItems: "center" },
                                    }}
                                    expandIcon={<ExpandMore />}
                                >
                                    <Typography>{phase}</Typography>
                                </AccordionSummary>
                                {!readOnly && (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={
                                                    taskOptions.filter(
                                                        (task) =>
                                                            task[GlobalConstants.PHASE] === phase,
                                                    ).length < 1
                                                }
                                                onChange={() => toggleAllTasksForPhase(phase)}
                                            />
                                        }
                                        label="Toggle All"
                                    />
                                )}

                                <FormGroup>
                                    {isTasksPending ? (
                                        <CircularProgress />
                                    ) : (
                                        getSortedTasksForPhase(phase).map((task) => (
                                            <TaskMenuOption
                                                key={
                                                    task[GlobalConstants.ID] ||
                                                    task[GlobalConstants.NAME]
                                                }
                                                event={event}
                                                task={task}
                                                readOnly={readOnly}
                                                selectedTasks={selectedTasks}
                                                setSelectedTasks={setSelectedTasks}
                                                setTaskOptions={setTaskOptions}
                                            />
                                        ))
                                    )}
                                </FormGroup>
                                {isUserHost(user, event) && (
                                    <Button
                                        sx={{ width: "100%" }}
                                        onClick={() => openAddTask(phase)}
                                    >
                                        add task
                                    </Button>
                                )}
                            </Accordion>
                        ))}
                    </Stack>
                    {readOnly && (
                        <Stack component={Paper} spacing={2} width="100%">
                            <Typography variant="h6" color={theme.palette.primary.main}>
                                My tasks
                            </Typography>
                            {sortTasks(selectedTasks).map((task) => (
                                <TaskMenuOption
                                    key={task[GlobalConstants.ID] || task[GlobalConstants.NAME]}
                                    event={event}
                                    task={task}
                                    readOnly={readOnly}
                                    selectedTasks={selectedTasks}
                                    setSelectedTasks={setSelectedTasks}
                                    setTaskOptions={setTaskOptions}
                                />
                            ))}
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
                        <Button onClick={saveSelectedTasks}>save tasks</Button>
                    </Stack>
                ) : isUserParticipant(user, event) ? (
                    <Button onClick={assignSelectedTasks}>assign tasks to me</Button>
                ) : (
                    <Button onClick={() => setPaymentHandlerOpen(true)}>buy ticket</Button>
                )}
            </Stack>
            <Dialog open={!!addTask} onClose={() => setAddTask(null)}>
                <Form
                    name={GlobalConstants.TASK}
                    action={addNewTask}
                    defaultValues={addTask}
                    buttonLabel="add task"
                    readOnly={false}
                    editable={false}
                />
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
