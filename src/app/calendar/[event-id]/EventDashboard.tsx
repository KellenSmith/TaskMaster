import {
    Accordion,
    AccordionSummary,
    Button,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Stack,
    Tab,
    Tabs,
} from "@mui/material";
import Form from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";
import { useMemo, useState } from "react";
import { CloseRounded, ExpandMore } from "@mui/icons-material";

const testTaskOptions = [
    { id: "1", name: "task 1", phase: GlobalConstants.BEFORE },
    { id: "2", name: "task 2", phase: GlobalConstants.BEFORE },
    { id: "3", name: "task 3", phase: GlobalConstants.DURING },
    { id: "4", name: "task 4", phase: GlobalConstants.DURING },
    { id: "5", name: "task 5", phase: GlobalConstants.AFTER },
    { id: "6", name: "task 6", phase: GlobalConstants.AFTER },
];

const EventDashboard = ({ saveEventAction }) => {
    const tabs = useMemo(() => ({ event: "Event", tasks: "Tasks" }), []);
    const [openTab, setTab] = useState(tabs.event);
    const [taskOptions, setTaskOptions] = useState(testTaskOptions);
    const [selectedTasks, setSelectedTasks] = useState([]);

    const deleteTaskFromOptions = (task) =>
        setTaskOptions((prev) => [
            ...prev.filter(
                (taskOption) => taskOption[GlobalConstants.ID] !== task[GlobalConstants.ID],
            ),
        ]);

    const isTaskSelected = (task) =>
        selectedTasks.map((task) => task[GlobalConstants.ID]).includes(task[GlobalConstants.ID]);

    const toggleTask = (toggledTask) => {
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

    return (
        <Stack>
            <Tabs value={openTab} onChange={(_, newTab) => setTab(newTab)}>
                {Object.keys(tabs).map((tab) => (
                    <Tab key={tabs[tab]} value={tabs[tab]} label={tabs[tab]} />
                ))}
            </Tabs>
            {openTab === tabs.event && (
                <Form
                    name={GlobalConstants.EVENT}
                    buttonLabel={GlobalConstants.CREATE}
                    action={saveEventAction}
                />
            )}
            {openTab === tabs.tasks && (
                <Stack spacing={2}>
                    {[GlobalConstants.BEFORE, GlobalConstants.DURING, GlobalConstants.AFTER].map(
                        (phase) => (
                            <Accordion key={phase}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    {phase}
                                </AccordionSummary>
                                <FormGroup>
                                    {[...taskOptions, ...selectedTasks]
                                        .filter((task) => task[GlobalConstants.PHASE] === phase)
                                        .map((task) => (
                                            <Stack
                                                key={task[GlobalConstants.ID]}
                                                direction="row"
                                                justifyContent="space-between"
                                            >
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={isTaskSelected(task)}
                                                            onChange={() => toggleTask(task)}
                                                        />
                                                    }
                                                    label={task[GlobalConstants.NAME]}
                                                />
                                                {!isTaskSelected(task) && (
                                                    <Button
                                                        onClick={() => deleteTaskFromOptions(task)}
                                                    >
                                                        <CloseRounded />
                                                    </Button>
                                                )}
                                            </Stack>
                                        ))}
                                </FormGroup>
                            </Accordion>
                        ),
                    )}
                </Stack>
            )}
        </Stack>
    );
};
export default EventDashboard;
