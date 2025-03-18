import { Accordion, AccordionSummary, Card, CardContent, Stack, Typography } from "@mui/material";
import GlobalConstants from "../../../../GlobalConstants";
import dayjs, { Dayjs } from "dayjs";
import { formatDate } from "../../../../ui/utils";
import TaskMenuOption from "./TaskMenuOption";
import { ExpandMore } from "@mui/icons-material";

const TaskShifts = ({
    event,
    tasks,
    readOnly,
    selectedTasks,
    setSelectedTasks,
    setTaskOptions,
}) => {
    const getEarliestStartTime = () =>
        tasks
            .map((task) => dayjs(task[GlobalConstants.START_TIME]))
            .sort((start1: Dayjs, start2: Dayjs) => start1.isBefore(start2))[0];

    const getLatestEndTime = () =>
        tasks
            .map((task) => dayjs(task[GlobalConstants.END_TIME]))
            .sort((start1: Dayjs, start2: Dayjs) => start1.isBefore(start2))
            .at(-1);

    const getTitleComp = () => {
        if (tasks.length > 1)
            return (
                <Typography key="title" variant="body1">
                    {tasks[0][GlobalConstants.NAME] +
                        "\t" +
                        formatDate(getEarliestStartTime()) +
                        " - " +
                        formatDate(getLatestEndTime())}
                </Typography>
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
