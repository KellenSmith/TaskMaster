import {
    Button,
    Divider,
    Drawer,
    FormControlLabel,
    Stack,
    Switch,
    Tab,
    Tabs,
    Typography,
    useTheme,
} from "@mui/material";
import { Prisma, TaskStatus } from "@prisma/client";
import { Dispatch, FormEvent, SetStateAction, use, useMemo, useState } from "react";
import { useUserContext } from "../../context/UserContext";
import dayjs from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers";
import LanguageTranslations, { menuTabs } from "./LanguageTranslations";
import { useNotificationContext } from "../../context/NotificationContext";
import { TaskFilterSchema } from "../../lib/zod-schemas";
import z from "zod";
import AutocompleteWrapper from "../form/AutocompleteWrapper";
import GlobalConstants from "../../GlobalConstants";
import { ChevronRight } from "@mui/icons-material";
import { getGroupedAndSortedTasks } from "../../(pages)/event/event-utils";
import DraggableTaskShifts from "./DraggableTaskShifts";
import TaskSchedulePDF from "./TaskSchedulePDF";
import { pdf } from "@react-pdf/renderer";
import { openResourceInNewTab } from "../utils";

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
        if (value)
            filteredTasks = filterOptions[key]({ tasks: filteredTasks, value, userId }) as T[];
    }
    return filteredTasks;
};

interface KanBanBoardFilterProps {
    eventPromise?: Promise<Prisma.EventGetPayload<{}>>;
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
        }>[]
    >;
    appliedFilter: z.infer<typeof TaskFilterSchema> | null;
    setAppliedFilter: Dispatch<SetStateAction<any>>;
}

const KanBanBoardMenu = ({
    eventPromise,
    tasksPromise,
    appliedFilter,
    setAppliedFilter,
}: KanBanBoardFilterProps) => {
    const theme = useTheme();
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const event = eventPromise ? use(eventPromise) : null;
    const tasks = use(tasksPromise);
    const myTasks = tasks.filter((task) => task.assignee_id === user.id);
    const [menuOpen, setMenuOpen] = useState(true);
    const tagsOptions = useMemo(
        () =>
            [...new Set(tasks.map((task) => task.tags).flat())].map((tag) => ({
                label: tag,
                id: tag,
            })),
        [tasks],
    );

    const [tabOpen, setTabOpen] = useState<string | null>(menuTabs.my_tasks);
    // Drawer width - keep in sync with the Drawer paper width below.
    const drawerWidth = useMemo(() => (menuOpen ? 360 : 0), [menuOpen]);

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

    const printVisibleTasksToPdf = async () => {
        const taskSchedule = await pdf(
            <TaskSchedulePDF
                event={event}
                tasks={getFilteredTasks(appliedFilter, tasks, user.id)}
            />,
        ).toBlob();
        const url = URL.createObjectURL(taskSchedule);
        openResourceInNewTab(url);
    };

    return (
        <Stack direction="row" width="fit-content" height="100%">
            <Tabs
                orientation="vertical"
                value={tabOpen}
                onChange={(_, newValue) => setTabOpen(newValue)}
                sx={{
                    // Place tabs above the drawer so the drawer doesn't cover them
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    position: "absolute",
                    top: 90,
                    right: drawerWidth,
                    padding: 1,
                    backgroundColor: (theme) => theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRight: null,
                }}
            >
                {Object.entries(menuTabs).map(
                    ([key, label]) =>
                        label && (
                            <Tab
                                key={key}
                                onClick={() => setMenuOpen(true)}
                                value={label}
                                label={
                                    <Typography
                                        sx={{
                                            whiteSpace: "nowrap",
                                            display: "inline-block",
                                            // Only show vertical, rotated tab labels on small screens (mobile).
                                            [theme.breakpoints.down("sm")]: {
                                                writingMode: "vertical-rl",
                                                transform: "rotate(180deg)",
                                            },
                                        }}
                                    >
                                        {LanguageTranslations[label][language] as string}
                                    </Typography>
                                }
                                sx={{ paddingX: 1, width: "fit-content", minWidth: 12 }}
                            />
                        ),
                )}
            </Tabs>
            <Drawer
                key={myTasks.map((task) => task.assignee_id).join("-")}
                variant="persistent"
                anchor="right"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    // Ensure drawer paper has a fixed width so it doesn't unexpectedly
                    // cover the left-side tabs.
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                    },
                }}
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
            >
                <Stack justifyContent="center" padding={2}>
                    <Button
                        sx={{ justifyContent: "flex-start" }}
                        size="large"
                        startIcon={<ChevronRight />}
                        onClick={() => setMenuOpen(false)}
                    >
                        {LanguageTranslations[tabOpen][language]}
                    </Button>
                    <Divider />
                    {tabOpen === menuTabs.filter && (
                        <form key={JSON.stringify(appliedFilter)} onSubmit={applyFilter}>
                            <Stack spacing={2}>
                                {Object.keys(filterOptions).map((fieldId) =>
                                    getFilterOptionComp(fieldId as FilterNameType),
                                )}
                                <Button type="submit">
                                    {LanguageTranslations.apply[language]}
                                </Button>
                                <Button onClick={() => setAppliedFilter(null)}>
                                    {LanguageTranslations.clear[language]}
                                </Button>
                                <Button onClick={printVisibleTasksToPdf}>
                                    {LanguageTranslations.printSchedule[language]}
                                </Button>
                            </Stack>
                        </form>
                    )}
                    {tabOpen === menuTabs.my_tasks && (
                        <Stack spacing={2}>
                            {myTasks.length > 0 ? (
                                getGroupedAndSortedTasks<(typeof tasks)[0]>(myTasks).map(
                                    (taskList) => (
                                        <DraggableTaskShifts
                                            key={taskList.map((task) => task.id).join("-")}
                                            readOnly={true}
                                            taskList={taskList}
                                        />
                                    ),
                                )
                            ) : (
                                <Typography textAlign="center" paddingY={2}>
                                    {LanguageTranslations.noShiftsBooked[language]}
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Stack>
            </Drawer>
        </Stack>
    );
};

export default KanBanBoardMenu;
