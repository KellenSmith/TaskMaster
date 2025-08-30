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
import LanguageTranslations from "./LanguageTranslations";

export const filterOptions = {
    unassigned: (filteredTasks: Prisma.TaskGetPayload<{}>[]) =>
        filteredTasks.filter((task) => !task.assignee_id),
    assigned_to_me: (filteredTasks: Prisma.TaskGetPayload<{}>[], userId: string) =>
        filteredTasks.filter((task) => task.assignee_id === userId),
    for_me_to_review: (filteredTasks: Prisma.TaskGetPayload<{}>[], userId: string) =>
        filteredTasks.filter((task) => task.reviewer_id === userId),
    begins_after: (filteredTasks: Prisma.TaskGetPayload<{}>[], date: Date) =>
        filteredTasks.filter((task) => dayjs(task.start_time).isAfter(dayjs(date))),
    ends_before: (filteredTasks: Prisma.TaskGetPayload<{}>[], date: Date) =>
        filteredTasks.filter((task) => dayjs(task.end_time).isBefore(dayjs(date))),
    has_tag: (filteredTasks: Prisma.TaskGetPayload<{}>[], tag: string) =>
        filteredTasks.filter((task) => task.tags.includes(tag)),
};

export const getFilteredTasks = (appliedFilter, tasks) => {
    if (!appliedFilter) return tasks;
    let filteredTasks = [...tasks];
    for (const [key, value] of Object.entries(appliedFilter)) {
        if (value && filterOptions[key]) {
            filteredTasks = filterOptions[key](filteredTasks, value);
        }
    }
    return filteredTasks;
};

interface KanBanBoardFilterProps {
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>[]
    >;
    setAppliedFilter: Dispatch<SetStateAction<any>>;
}

const KanBanBoardFilter = ({ tasksPromise, setAppliedFilter }: KanBanBoardFilterProps) => {
    const { language } = useUserContext();
    const tasks = use(tasksPromise);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const tagsOptions = useMemo(() => [...new Set(tasks.map((task) => task.tags).flat())], [tasks]);

    const applyFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const submittedFilters = Object.fromEntries(formData);
        setAppliedFilter(submittedFilters);
    };

    const getFilterOptionComp = (fieldId: keyof typeof filterOptions) => {
        const label = LanguageTranslations[fieldId][language];

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
            <Button onClick={() => setFiltersOpen(true)}>
                {LanguageTranslations.openFilter[language]}
            </Button>
            <Drawer anchor="right" open={filtersOpen} onClose={() => setFiltersOpen(false)}>
                <form onSubmit={applyFilter}>
                    <Stack spacing={2}>
                        <Button onClick={() => setFiltersOpen(false)}>Close</Button>
                        {Object.keys(filterOptions).map((fieldId) =>
                            getFilterOptionComp(fieldId as keyof typeof filterOptions),
                        )}
                        <Button type="submit">{LanguageTranslations.apply[language]}</Button>
                        <Button onClick={() => setAppliedFilter(null)}>
                            {LanguageTranslations.clear[language]}
                        </Button>
                    </Stack>
                </form>
            </Drawer>
        </>
    );
};

export default KanBanBoardFilter;
