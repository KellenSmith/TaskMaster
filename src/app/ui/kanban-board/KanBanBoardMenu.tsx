import { Button, Drawer, FormControlLabel, Stack, Switch } from "@mui/material";
import { Prisma, TaskStatus } from "@prisma/client";
import { Dispatch, FormEvent, SetStateAction, use, useMemo, useState } from "react";
import { useUserContext } from "../../context/UserContext";
import dayjs from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers";
import LanguageTranslations from "./LanguageTranslations";
import { useNotificationContext } from "../../context/NotificationContext";
import { TaskFilterSchema } from "../../lib/zod-schemas";
import z from "zod";
import AutocompleteWrapper from "../form/AutocompleteWrapper";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import GlobalConstants from "../../GlobalConstants";

type FilterNameType = keyof typeof filterOptions & string;
type FilterValueType = boolean | string | string[] | TaskStatus[];
type FilterFunctionProps = {
    tasks: Prisma.TaskGetPayload<{}>[];
    value?: FilterValueType;
    userId?: string;
};
export const filterOptions = {
    unassigned: ({ tasks }: FilterFunctionProps) => tasks?.filter((task) => !task.assignee_id),
    assigned_to_me: ({ tasks, userId }: FilterFunctionProps) =>
        tasks?.filter((task) => task.assignee_id === userId),
    for_me_to_review: ({ tasks, userId }: FilterFunctionProps) =>
        tasks?.filter((task) => task.reviewer_id === userId),
    begins_after: ({ tasks, value }: FilterFunctionProps) =>
        tasks?.filter((task) => dayjs(task.start_time).isAfter(dayjs(value as string), "minute")),
    ends_before: ({ tasks, value }: FilterFunctionProps) =>
        tasks?.filter((task) => dayjs(task.end_time).isBefore(dayjs(value as string), "minute")),
    has_tag: ({ tasks, value }: FilterFunctionProps) =>
        tasks?.filter((task) => task.tags.some((tag) => (value as string[])?.includes(tag))),
    [GlobalConstants.STATUS]: ({ tasks, value }) =>
        tasks?.filter((task: Prisma.TaskGetPayload<{}>) =>
            (value as TaskStatus[]).includes(task.status),
        ),
};

export const getFilteredTasks = <T extends Prisma.TaskGetPayload<true>>(
    appliedFilter: z.infer<typeof TaskFilterSchema>,
    tasks: T[],
    userId: string,
): T[] => {
    if (!appliedFilter) return tasks;
    let filteredTasks = [...tasks];
    for (const [key, value] of Object.entries(appliedFilter)) {
        if (!!value)
            filteredTasks = filterOptions[key]({ tasks: filteredTasks, value, userId }) as T[];
    }
    return filteredTasks;
};

interface KanBanBoardFilterProps {
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>[]
    >;
    appliedFilter: z.infer<typeof TaskFilterSchema> | null;
    setAppliedFilter: Dispatch<SetStateAction<any>>;
}

const KanBanBoardMenu = ({
    tasksPromise,
    appliedFilter,
    setAppliedFilter,
}: KanBanBoardFilterProps) => {
    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const tasks = use(tasksPromise);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const tagsOptions = useMemo(
        () =>
            [...new Set(tasks.map((task) => task.tags).flat())].map((tag) => ({
                label: tag,
                id: tag,
            })),
        [tasks],
    );

    const applyFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
            const parsedFilterValues = TaskFilterSchema.parse(Object.fromEntries(formData));
            setAppliedFilter(parsedFilterValues);
        } catch (error) {
            console.log("Error applying filter:", error);
            addNotification(LanguageTranslations.filtrationError[language], "error");
        }
    };

    const getFilterOptionComp = (fieldId: FilterNameType) => {
        const label = LanguageTranslations[fieldId][language];

        if (["begins_after", "ends_before"].includes(fieldId))
            return (
                <DateTimePicker
                    key={fieldId}
                    name={fieldId}
                    label={label}
                    defaultValue={appliedFilter?.[fieldId] || null}
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
                <FormControlLabel
                    key={fieldId}
                    control={
                        <Switch name={fieldId} defaultChecked={appliedFilter?.[fieldId] || false} />
                    }
                    label={label}
                />
            );
        if (fieldId === "has_tag")
            return (
                <AutocompleteWrapper
                    key={fieldId}
                    fieldId={fieldId}
                    label={label}
                    defaultValue={appliedFilter?.[fieldId] || null}
                    customOptions={tagsOptions}
                    customMultiple={true}
                    editMode={true}
                />
            );
        if (fieldId === GlobalConstants.STATUS)
            return (
                <AutocompleteWrapper
                    key={fieldId}
                    fieldId={fieldId}
                    label={label}
                    defaultValue={appliedFilter?.[fieldId] || null}
                    customMultiple={true}
                    editMode={true}
                />
            );
        return null;
    };

    return (
        <>
            <Button onClick={() => setFiltersOpen(true)}>
                {LanguageTranslations.openFilter[language]}
            </Button>
            <Drawer
                anchor="right"
                variant="permanent"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
            >
                {filtersOpen && (
                    <form key={JSON.stringify(appliedFilter)} onSubmit={applyFilter}>
                        <Stack spacing={2}>
                            <Button variant="outlined" onClick={() => setFiltersOpen(false)}>
                                {GlobalLanguageTranslations.close[language]}
                            </Button>
                            {Object.keys(filterOptions).map((fieldId) =>
                                getFilterOptionComp(fieldId as FilterNameType),
                            )}
                            <Button type="submit">{LanguageTranslations.apply[language]}</Button>
                            <Button onClick={() => setAppliedFilter(null)}>
                                {LanguageTranslations.clear[language]}
                            </Button>
                        </Stack>
                    </form>
                )}
            </Drawer>
        </>
    );
};

export default KanBanBoardMenu;
