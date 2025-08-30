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
import { DateTimePicker } from "@mui/x-date-pickers";
import LanguageTranslations from "./LanguageTranslations";

export const filterOptions = {
    unassigned: (tasks: Prisma.TaskGetPayload<{}>[]) => tasks.filter((task) => !task.assignee_id),
    assigned_to_me: (tasks: Prisma.TaskGetPayload<{}>[], userId: string) =>
        tasks.filter((task) => task.assignee_id === userId),
    for_me_to_review: (tasks: Prisma.TaskGetPayload<{}>[], userId: string) =>
        tasks.filter((task) => task.reviewer_id === userId),
    begins_after: (tasks: Prisma.TaskGetPayload<{}>[], date: string) =>
        tasks.filter((task) => dayjs(task.start_time).isAfter(dayjs(date, "L HH:mm"), "minute")),
    ends_before: (tasks: Prisma.TaskGetPayload<{}>[], date: string) =>
        tasks.filter((task) => dayjs(task.end_time).isBefore(dayjs(date, "L HH:mm"), "minute")),
    has_tag: (tasks: Prisma.TaskGetPayload<{}>[], tag: string) =>
        tasks.filter((task) => task.tags.includes(tag)),
};

export const getFilteredTasks = <T extends Prisma.TaskGetPayload<true>>(
    appliedFilter: Record<keyof typeof filterOptions, string | undefined>,
    tasks: T[],
    userId: string,
): T[] => {
    if (!appliedFilter) return tasks;
    let filteredTasks = [...tasks];

    for (const [key, value] of Object.entries(appliedFilter)) {
        if (value && filterOptions[key])
            filteredTasks = filterOptions[key](filteredTasks, value, userId);
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
        const submittedFilters = Object.fromEntries(formData.entries());
        setAppliedFilter(submittedFilters);
    };

    const getFilterOptionComp = (fieldId: keyof typeof filterOptions) => {
        const label = LanguageTranslations[fieldId][language];

        if (["begins_after", "ends_before"].includes(fieldId))
            return (
                <DateTimePicker
                    key={fieldId}
                    name={fieldId}
                    label={label}
                    defaultValue={dayjs().minute(0).second(0)}
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
