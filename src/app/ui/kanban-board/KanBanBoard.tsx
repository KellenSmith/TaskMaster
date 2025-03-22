"use client";

import React, { useState } from "react";
import {
    Accordion,
    AccordionSummary,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid2,
    Stack,
    Switch,
} from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { defaultActionState, getFormActionMsg } from "../form/Form";
import DroppableColumn from "./DroppableColumn";
import { FieldLabels, selectFieldOptions } from "../form/FieldCfg";
import { ExpandMore } from "@mui/icons-material";
import { useUserContext } from "../../context/UserContext";

const KanBanBoard = ({ event = null, tasks, fetchDbTasks, isTasksPending, readOnly = true }) => {
    const { user } = useUserContext();
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const [taskActionState, setTaskActionState] = useState(defaultActionState);

    const getUniqueFilterOptions = (filterId) => {
        if (filterId === GlobalConstants.ASSIGNEE_ID) return [user[GlobalConstants.ID]];
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
            [GlobalConstants.ASSIGNEE_ID, GlobalConstants.PHASE, GlobalConstants.TAGS].map(
                (filterId) => [filterId, []],
            ),
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
                        label={
                            filterId === GlobalConstants.ASSIGNEE_ID
                                ? "My tasks"
                                : FieldLabels[filterOption] || filterOption
                        }
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

    return (
        <>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>Filters</AccordionSummary>
                <Stack direction="row" spacing={2}>
                    {Object.keys(filters).map((filterId) => getSwitchGroup(filterId))}
                </Stack>
            </Accordion>
            {getFormActionMsg(taskActionState)}
            <Grid2 container spacing={2} columns={4}>
                {selectFieldOptions[GlobalConstants.STATUS].map((status) => (
                    <Grid2 size={1} key={status}>
                        <DroppableColumn
                            event={event}
                            status={status}
                            tasks={filterTasks(tasks, filters).filter(
                                (task) => task[GlobalConstants.STATUS] === status,
                            )}
                            isTasksPending={isTasksPending}
                            fetchDbTasks={fetchDbTasks}
                            taskActionState={taskActionState}
                            setTaskActionState={setTaskActionState}
                            readOnly={readOnly}
                            draggedTask={draggedTask}
                            setDraggedTask={setDraggedTask}
                            draggedOverColumn={draggedOverColumn}
                            setDraggedOverColumn={setDraggedOverColumn}
                        />
                    </Grid2>
                ))}
            </Grid2>
        </>
    );
};

export default KanBanBoard;
