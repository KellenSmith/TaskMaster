"use client";

import React, { startTransition, useEffect, useState } from "react";
import {
    Accordion,
    AccordionSummary,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid2,
    Stack,
    Switch,
} from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { defaultActionState as defaultFormActionState, getFormActionMsg } from "../form/Form";
import DroppableColumn from "./DroppableColumn";
import { FieldLabels, selectFieldOptions } from "../form/FieldCfg";
import { ExpandMore } from "@mui/icons-material";
import { useUserContext } from "../../context/UserContext";
import TaskSchedulePDF from "./TaskSchedulePDF";
import { pdf } from "@react-pdf/renderer";
import { getActiveMembers } from "../../lib/user-actions";
import { defaultActionState as defaultDatagridActionState } from "../Datagrid";

const KanBanBoard = ({ event = null, tasks, fetchDbTasks, isTasksPending, readOnly = true }) => {
    const { user } = useUserContext();
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const [taskActionState, setTaskActionState] = useState(defaultFormActionState);
    const [activeMembers, setActiveMembers] = useState<string[]>(null);

    useEffect(() => {
        startTransition(async () => {
            const result = await getActiveMembers(defaultDatagridActionState);
            setActiveMembers(result.result);
        });
        // Fetch active members only once when the component mounts
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getUniqueFilterOptions = (filterId) => {
        if (filterId === GlobalConstants.ASSIGNEE_ID) return [user[GlobalConstants.ID], null];
        if (filterId === GlobalConstants.REPORTER_ID) return [user[GlobalConstants.ID]];
        const existingFilterOptions = [];
        for (let task of tasks) {
            if (Array.isArray(task[filterId]))
                for (let tag of task[filterId]) {
                    if (!existingFilterOptions.includes(tag)) existingFilterOptions.push(tag);
                }
            else if (!existingFilterOptions.includes(task[filterId]))
                existingFilterOptions.push(task[filterId]);
        }
        return existingFilterOptions;
    };

    const [filters, setFilters] = useState(
        Object.fromEntries(
            [
                GlobalConstants.ASSIGNEE_ID,
                GlobalConstants.REPORTER_ID,
                GlobalConstants.PHASE,
                GlobalConstants.TAGS,
            ].map((filterId) => [filterId, []]),
        ),
    );

    const toggleFilterSwitch = (newValue, filterId, filterOption) => {
        if (newValue)
            setFilters((prev) => ({ ...prev, [filterId]: [...prev[filterId], filterOption] }));
        else
            setFilters((prev) => ({
                ...prev,
                [filterId]: prev[filterId].filter((option) => option !== filterOption),
            }));
    };

    const getFilterOptionLabel = (filterId, filterOption) => {
        if (filterId === GlobalConstants.ASSIGNEE_ID) {
            if (filterOption === null) return "Unassigned";
            return "Assigned to me";
        }
        if (filterId === GlobalConstants.REPORTER_ID) return "Reports to me";

        return FieldLabels[filterOption] || filterOption;
    };

    const getSwitchGroup = (filterId) => (
        <FormControl key={filterId} component="fieldset" variant="standard">
            <FormLabel component="legend">{FieldLabels[filterId]}</FormLabel>
            <FormGroup>
                {getUniqueFilterOptions(filterId).map((filterOption) => (
                    <FormControlLabel
                        key={filterOption}
                        control={
                            <Switch
                                checked={filters[filterId].includes(filterOption)}
                                onChange={(_, newValue) =>
                                    toggleFilterSwitch(newValue, filterId, filterOption)
                                }
                                name={filterOption}
                            />
                        }
                        label={getFilterOptionLabel(filterId, filterOption)}
                    />
                ))}
            </FormGroup>
        </FormControl>
    );

    const filterTasks = (tasks, filters) => {
        return tasks.filter((task) => {
            return Object.keys(filters).every((filterId) => {
                if (filters[filterId].length === 0) return true;
                if (Array.isArray(task[filterId])) {
                    return filters[filterId].some((filterOption) =>
                        task[filterId].includes(filterOption),
                    );
                }
                return filters[filterId].includes(task[filterId]);
            });
        });
    };

    const printVisibleTasksToPdf = async () => {
        const taskSchedule = await pdf(
            <TaskSchedulePDF event={event} tasks={filterTasks(tasks, filters)} />,
        ).toBlob();
        const url = URL.createObjectURL(taskSchedule);
        window.open(url, "_blank");
    };

    return (
        <Stack spacing={2} justifyContent="center">
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>Filters</AccordionSummary>
                <Stack direction="row" spacing={2}>
                    {Object.keys(filters).map((filterId) => getSwitchGroup(filterId))}
                </Stack>
                <Button fullWidth onClick={printVisibleTasksToPdf}>
                    print task schedule
                </Button>
            </Accordion>
            {getFormActionMsg(taskActionState)}
            {isTasksPending ? (
                <CircularProgress sx={{ alignSelf: "center", padding: 10 }} />
            ) : (
                <Grid2 container spacing={2} columns={4}>
                    {selectFieldOptions[GlobalConstants.STATUS].map((status) => (
                        <Grid2 size={1} key={status}>
                            <DroppableColumn
                                event={event}
                                status={status}
                                tasks={filterTasks(tasks, filters).filter(
                                    (task) => task[GlobalConstants.STATUS] === status,
                                )}
                                fetchDbTasks={fetchDbTasks}
                                taskActionState={taskActionState}
                                setTaskActionState={setTaskActionState}
                                readOnly={readOnly}
                                draggedTask={draggedTask}
                                setDraggedTask={setDraggedTask}
                                draggedOverColumn={draggedOverColumn}
                                setDraggedOverColumn={setDraggedOverColumn}
                                activeMembers={activeMembers}
                            />
                        </Grid2>
                    ))}
                </Grid2>
            )}
        </Stack>
    );
};

export default KanBanBoard;
