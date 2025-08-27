import {
    Autocomplete,
    Button,
    Drawer,
    FormControlLabel,
    Stack,
    Switch,
    TextField,
} from "@mui/material";
import { Prisma } from "@prisma/client";
import { Dispatch, FormEvent, SetStateAction, use, useMemo, useState } from "react";
import { useUserContext } from "../../context/UserContext";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { snakeCaseToLabel } from "../../lib/definitions";

interface KanBanBoardFilterProps {
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>[]
    >;
    setFilteredTasks: Dispatch<SetStateAction<any[]>>;
}

const KanBanBoardFilter = ({ tasksPromise, setFilteredTasks }: KanBanBoardFilterProps) => {
    const { user } = useUserContext();
    const tasks = use(tasksPromise);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const tagsOptions = useMemo(() => [...new Set(tasks.map((task) => task.tags).flat())], [tasks]);

    const applyFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const filters = Object.fromEntries(formData);

        let filteredTasks = [...tasks];
        for (const [key, value] of Object.entries(filters)) {
            if (value && filterOptions[key]) {
                filteredTasks = filterOptions[key](filteredTasks, value);
            }
        }
        setFilteredTasks(filteredTasks);
    };

    const filterOptions = {
        unassigned: (filteredTasks: typeof tasks) =>
            filteredTasks.filter((task) => !task.assigneeId),
        assigned_to_me: (filteredTasks: typeof tasks) =>
            filteredTasks.filter((task) => task.assigneeId === user.id),
        for_me_to_review: (filteredTasks: typeof tasks) =>
            filteredTasks.filter((task) => task.reviewerId === user.id),
        begins_after: (filteredTasks: typeof tasks, date: Date) =>
            filteredTasks.filter((task) => dayjs(task.startTime).isAfter(dayjs(date))),
        ends_before: (filteredTasks: typeof tasks, date: Date) =>
            filteredTasks.filter((task) => dayjs(task.endTime).isBefore(dayjs(date))),
        has_tag: (filteredTasks: typeof tasks, tag: string) =>
            filteredTasks.filter((task) => task.tags.includes(tag)),
    };

    const getFilterOptionComp = (fieldId: keyof typeof filterOptions) => {
        const label = snakeCaseToLabel(fieldId);

        if (["begins_after", "ends_before"].includes(fieldId))
            return (
                <DatePicker
                    key={fieldId}
                    name={fieldId}
                    label={label}
                    defaultValue={dayjs()}
                    slotProps={{
                        textField: {
                            name: fieldId,
                        },
                        actionBar: { actions: ["clear", "accept"] },
                    }}
                />
            );
        if (["unassigned", "assigned_to_me", "for_me_to_review"].includes(fieldId))
            return (
                <FormControlLabel key={fieldId} control={<Switch name={fieldId} />} label={label} />
            );
        if (fieldId === "has_tag")
            return (
                <Autocomplete
                    key={fieldId}
                    renderInput={(params) => <TextField {...params} label={label} />}
                    options={tagsOptions}
                    multiple
                />
            );
        return null;
    };

    return (
        <>
            <Button onClick={() => setFiltersOpen(true)}>open filter</Button>
            <Drawer anchor="right" open={filtersOpen} onClose={() => setFiltersOpen(false)}>
                <form onSubmit={applyFilter}>
                    <Stack spacing={2}>
                        <Button onClick={() => setFiltersOpen(false)}>Close</Button>
                        {Object.keys(filterOptions).map((fieldId) =>
                            getFilterOptionComp(fieldId as keyof typeof filterOptions),
                        )}
                        <Button type="submit">Apply Filters</Button>
                        <Button onClick={() => setFilteredTasks(tasks)}>clear</Button>
                    </Stack>
                </form>
            </Drawer>
        </>
    );
};

export default KanBanBoardFilter;
