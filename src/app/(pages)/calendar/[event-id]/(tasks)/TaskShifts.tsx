import {
    Accordion,
    AccordionSummary,
    Card,
    CardContent,
    Checkbox,
    Stack,
    Typography,
} from "@mui/material";
import GlobalConstants from "../../../../GlobalConstants";
import { formatDate } from "../../../../ui/utils";
import TaskMenuOption from "./TaskMenuOption";
import { ExpandMore } from "@mui/icons-material";
import { getEarliestStartTime, getLatestEndTime, isTaskSelected } from "../event-utils";

const TaskShifts = ({
    event,
    tasks,
    readOnly,
    selectedTasks,
    setSelectedTasks,
    setTaskOptions,
}) => {
    const areAllTaskShiftsSelected = () => {
        for (let task of tasks) {
            if (!isTaskSelected(task, selectedTasks)) return false;
        }
        return true;
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

    const getTitleComp = () => {
        if (tasks.length > 1)
            return (
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
                            formatDate(getEarliestStartTime(tasks)) +
                            " - " +
                            formatDate(getLatestEndTime(tasks))}
                    </Typography>
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
            />
        );
    };

    return (
        <Card>
            <CardContent>
                {getTitleComp()}
                {tasks?.length > 1 && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>Shifts</AccordionSummary>
                        <Stack sx={{ paddingLeft: 2 }}>
                            {tasks.map((task) => (
                                <TaskMenuOption
                                    key={task[GlobalConstants.ID]}
                                    task={task}
                                    event={event}
                                    readOnly={readOnly}
                                    selectedTasks={selectedTasks}
                                    setSelectedTasks={setSelectedTasks}
                                    setTaskOptions={setTaskOptions}
                                />
                            ))}
                        </Stack>
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
};

export default TaskShifts;
