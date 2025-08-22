"use client";

import React, { use, useState } from "react";
import {
    Accordion,
    AccordionSummary,
    Button,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid2,
    Stack,
    Switch,
    Typography,
} from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import DroppableColumn from "./DroppableColumn";
import { FieldLabels } from "../form/FieldCfg";
import { ExpandMore } from "@mui/icons-material";
import { useUserContext } from "../../context/UserContext";
import TaskSchedulePDF from "./TaskSchedulePDF";
import { pdf } from "@react-pdf/renderer";
import { Prisma, TaskStatus } from "@prisma/client";

interface KanBanBoardProps {
    readOnly: boolean;
    event?: Prisma.EventGetPayload<{
        include: { host: { select: { id: true; nickname: true } } };
    }> | null;
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>[]
    >;
    activeMembersPromise?: Promise<
        Prisma.UserGetPayload<{ select: { id: true; nickname: true } }>[]
    >;
}

const KanBanBoard = ({
    readOnly = true,
    event,
    tasksPromise,
    activeMembersPromise,
}: KanBanBoardProps) => {
    const { user } = useUserContext();
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const tasks = use(tasksPromise);

    const getUniqueFilterOptions = (filterId) => {
        if (filterId === GlobalConstants.ASSIGNEE_ID) return [user.id, null];
        if (filterId === GlobalConstants.REVIEWER_ID) return [user.id];
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
                GlobalConstants.REVIEWER_ID,
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
        if (filterId === GlobalConstants.REVIEWER_ID) return "Reports to me";

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

    const applyBoardFilter = (
        tasks: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>[],
        filters,
    ) => {
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
            <TaskSchedulePDF event={event} tasks={applyBoardFilter(tasks, filters)} />,
        ).toBlob();
        const url = URL.createObjectURL(taskSchedule);
        window.open(url, "_blank");
    };

    return (
        <Stack spacing={2} justifyContent="center" height="100%">
            {event && (
                <Typography textAlign="center" variant="h4" color="primary">
                    Assign yourself to tasks and shifts to help make the event happen
                </Typography>
            )}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>Filters</AccordionSummary>
                <Stack direction="row" spacing={2} padding={4}>
                    {Object.keys(filters).map((filterId) => getSwitchGroup(filterId))}
                </Stack>
                <Button fullWidth onClick={printVisibleTasksToPdf}>
                    print task schedule
                </Button>
            </Accordion>
            <Grid2 container spacing={2} columns={4} height="100%">
                {Object.values(TaskStatus).map((status) => (
                    <Grid2 size={1} key={status} height="100%">
                        <DroppableColumn
                            readOnly={readOnly}
                            event={event}
                            status={status}
                            tasks={applyBoardFilter(tasks, filters).filter(
                                (task) => task[GlobalConstants.STATUS] === status,
                            )}
                            activeMembersPromise={activeMembersPromise}
                            draggedTask={draggedTask}
                            setDraggedTask={setDraggedTask}
                            draggedOverColumn={draggedOverColumn}
                            setDraggedOverColumn={setDraggedOverColumn}
                        />
                    </Grid2>
                ))}
            </Grid2>
        </Stack>
    );
};

export default KanBanBoard;
