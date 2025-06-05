import {
    Accordion,
    AccordionSummary,
    Button,
    Card,
    CardContent,
    Checkbox,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import GlobalConstants from "../../../../GlobalConstants";
import { formatDate } from "../../../../ui/utils";
import TaskMenuOption from "./TaskMenuOption";
import { CloseRounded, ExpandMore } from "@mui/icons-material";
import { getEarliestStartTime, getLatestEndTime, isTaskSelected, sortTasks } from "../event-utils";
import dayjs from "dayjs";

const TaskShifts = ({
    event,
    tasks,
    readOnly,
    selectedTasks,
    setSelectedTasks,
    setTaskOptions,
    activeMembers,
}) => {
    const areAllTaskShiftsSelected = () => {
        for (let task of tasks) {
            if (!isTaskSelected(task, selectedTasks)) return false;
        }
        return true;
    };

    const isATaskSelected = () => {
        for (let task of tasks) {
            if (isTaskSelected(task, selectedTasks)) return true;
        }
        return false;
    };

    const toggleAllTaskShifts = (checked) => {
        if (checked) {
            const tasksToSelect = tasks.filter((task) => !isTaskSelected(task, selectedTasks));
            setSelectedTasks((prev) => [...prev, ...tasksToSelect]);
            const idsToSelect = tasksToSelect.map((task) => task[GlobalConstants.ID]);
            setTaskOptions((prev) =>
                prev.filter((task) => !idsToSelect.includes(task[GlobalConstants.ID])),
            );
            return;
        }
        const tasksToUnSelect = tasks.filter((task) => isTaskSelected(task, selectedTasks));
        setTaskOptions((prev) => [...prev, ...tasksToUnSelect]);
        const idsToUnSelect = tasksToUnSelect.map((task) => task[GlobalConstants.ID]);
        setSelectedTasks((prev) =>
            prev.filter((task) => !idsToUnSelect.includes(task[GlobalConstants.ID])),
        );
    };

    const deleteAllTaskShifts = () =>
        setTaskOptions((prev) =>
            prev.filter((task) => task[GlobalConstants.NAME] !== tasks[0][GlobalConstants.NAME]),
        );

    const getTitleComp = () => {
        if (tasks.length > 1)
            return (
                <Stack
                    key={tasks[0][GlobalConstants.NAME]}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Stack direction="row" alignItems="center">
                        {!readOnly && (
                            <Checkbox
                                checked={areAllTaskShiftsSelected()}
                                onChange={(event) => toggleAllTaskShifts(event.target.checked)}
                            />
                        )}
                        <Typography key="title" variant="body1">
                            {tasks[0][GlobalConstants.NAME] +
                                "\t" +
                                formatDate(dayjs(getEarliestStartTime(tasks))) +
                                " - " +
                                formatDate(dayjs(getLatestEndTime(tasks)))}
                        </Typography>
                    </Stack>
                    {!readOnly && !isATaskSelected() && (
                        <Tooltip
                            title={`Delete all shifts for task "${tasks[0][GlobalConstants.NAME]}"`}
                        >
                            <Button onClick={deleteAllTaskShifts}>
                                <CloseRounded />
                            </Button>
                        </Tooltip>
                    )}
                </Stack>
            );
        return (
            <TaskMenuOption
                key={tasks[0][GlobalConstants.ID]}
                task={tasks[0]}
                event={event}
                readOnly={readOnly}
                selectedTasks={selectedTasks}
                setSelectedTasks={setSelectedTasks}
                setTaskOptions={setTaskOptions}
                activeMembers={activeMembers}
            />
        );
    };

    return (
        tasks?.length > 0 && (
            <Card key={tasks[0][GlobalConstants.NAME]}>
                <CardContent>
                    {getTitleComp()}
                    {tasks?.length > 1 && (
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>Shifts</AccordionSummary>
                            <Stack key={tasks[0][GlobalConstants.NAME]} sx={{ paddingLeft: 2 }}>
                                {tasks.sort(sortTasks).map((task) => (
                                    <TaskMenuOption
                                        key={task[GlobalConstants.ID]}
                                        task={task}
                                        event={event}
                                        readOnly={readOnly}
                                        selectedTasks={selectedTasks}
                                        setSelectedTasks={setSelectedTasks}
                                        setTaskOptions={setTaskOptions}
                                        activeMembers={activeMembers}
                                    />
                                ))}
                            </Stack>
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        )
    );
};

export default TaskShifts;
