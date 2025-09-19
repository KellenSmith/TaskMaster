import {
    Badge,
    Button,
    Divider,
    FormControlLabel,
    Stack,
    SwipeableDrawer,
    Switch,
    Tab,
    Tabs,
    Typography,
    IconButton,
    Fab,
    Box,
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
import { ChevronRight, Menu } from "@mui/icons-material";
import { getGroupedAndSortedTasks } from "../../(pages)/calendar-post/event-utils";
import DraggableTaskShifts from "./DraggableTaskShifts";
import TaskSchedulePDF from "./TaskSchedulePDF";
import { pdf } from "@react-pdf/renderer";
import { openResourceInNewTab } from "../utils";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";

type FilterNameType = keyof typeof filterOptions & string;
type FilterValueType = boolean | string | string[] | TaskStatus[];
type FilterFunctionProps = {
    tasks: Prisma.TaskGetPayload<true>[];
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
        tasks?.filter(
            (task) =>
                dayjs.utc(task.start_time).isAfter(dayjs.utc(value as string), "minute") ||
                dayjs.utc(task.start_time).isSame(dayjs.utc(value as string), "minute"),
        ),
    ends_before: ({ tasks, value }: FilterFunctionProps) =>
        tasks?.filter(
            (task) =>
                dayjs.utc(task.end_time).isBefore(dayjs.utc(value as string), "minute") ||
                dayjs.utc(task.end_time).isSame(dayjs.utc(value as string), "minute"),
        ),
    has_tag: ({ tasks, value }: FilterFunctionProps) =>
        tasks?.filter((task) => task.tags.some((tag) => (value as string[])?.includes(tag))),
    [GlobalConstants.STATUS]: ({ tasks, value }) =>
        tasks?.filter((task: Prisma.TaskGetPayload<true>) =>
            (value as TaskStatus[]).includes(task.status),
        ),
};

export const getFilteredTasks = <T extends Prisma.TaskGetPayload<true>>(
    appliedFilter: z.infer<typeof TaskFilterSchema>,
    tasks: T[],
    userId: string,
): T[] => {
    if (!appliedFilter) return tasks;
    const filteredTasks: T[] = [];
    for (const [key, value] of Object.entries(appliedFilter)) {
        const tasksFitInFilter = filterOptions[key as FilterNameType]({ tasks, value, userId });
        filteredTasks.push(...(tasksFitInFilter as T[]));
    }
    return filteredTasks;
};

interface KanBanBoardFilterProps {
    eventPromise?: Promise<Prisma.EventGetPayload<true>>;
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
        }>[]
    >;
    appliedFilter: z.infer<typeof TaskFilterSchema> | null;
    setAppliedFilter: Dispatch<SetStateAction<z.infer<typeof TaskFilterSchema> | null>>;
}

const KanBanBoardMenu = ({
    eventPromise,
    tasksPromise,
    appliedFilter,
    setAppliedFilter,
}: KanBanBoardFilterProps) => {
    const isIOSDevice = useMemo(
        () => typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent),
        [],
    );
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
        } catch {
            addNotification(LanguageTranslations.filtrationError[language], "error");
        }
    };

    const getFilterOptionComp = (fieldId: FilterNameType) => {
        const label = LanguageTranslations[fieldId][language] as string;

        if (["begins_after", "ends_before"].includes(fieldId))
            return (
                <DateTimePicker
                    key={fieldId}
                    name={fieldId}
                    label={label}
                    defaultValue={
                        appliedFilter?.[fieldId]
                            ? dayjs.utc(appliedFilter[fieldId] as string)
                            : null
                    }
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
        <Box sx={{ position: "relative" }}>
            {/* Desktop subtle off-canvas handle - mostly hidden until hover */}
            <Box
                sx={{
                    position: "fixed",
                    top: "50%",
                    right: 0,
                    transform: "translateY(-50%)",
                    display: { xs: "none", sm: "flex" },
                    zIndex: (theme) => theme.zIndex.drawer + 2,
                    alignItems: "center",
                }}
            >
                <Box
                    sx={{
                        width: 36,
                        height: 64,
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8,
                        bgcolor: "background.paper",
                        boxShadow: 1,
                        transform: "translateX(50%)",
                        transition: "transform 200ms ease",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "&:hover": {
                            transform: "translateX(0)",
                        },
                    }}
                >
                    <IconButton
                        aria-label="open kanban menu"
                        onClick={() => setMenuOpen(true)}
                        size="small"
                        sx={{ p: 0 }}
                    >
                        <ChevronRight />
                    </IconButton>
                </Box>
            </Box>
            {/* Mobile FAB */}
            <Badge
                variant="dot"
                invisible={myTasks.length === 0}
                color="success"
                sx={{
                    position: "fixed",
                    right: 16,
                    bottom: 16,
                    display: { xs: "inline-flex", sm: "none" },
                    zIndex: (theme) => theme.zIndex.drawer + 2,
                }}
            >
                <Fab
                    color="primary"
                    size="small"
                    aria-label="open kanban menu"
                    onClick={() => setMenuOpen((prev) => !prev)}
                >
                    <Menu />
                </Fab>
            </Badge>
            <Stack direction="row" width="fit-content" height="100%">
                {/* Tabs moved inside the drawer for better mobile UX */}
                <SwipeableDrawer
                    key={myTasks.map((task) => task.assignee_id).join("-")}
                    anchor="right"
                    open={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    onOpen={() => setMenuOpen(true)}
                    disableBackdropTransition={isIOSDevice}
                    disableDiscovery={isIOSDevice}
                    swipeAreaWidth={24}
                    sx={{ flexShrink: 0 }}
                    slotProps={{ paper: { sx: { width: { xs: "85vw", sm: drawerWidth } } } }}
                >
                    <Stack justifyContent="center" padding={2} spacing={2}>
                        <Button
                            sx={{ justifyContent: "flex-start" }}
                            size="small"
                            startIcon={<ChevronRight />}
                            onClick={() => setMenuOpen(false)}
                        >
                            {GlobalLanguageTranslations.close[language] || "Close"}
                        </Button>
                        <Divider />
                        <Tabs
                            value={tabOpen}
                            onChange={(_, newValue) => setTabOpen(newValue)}
                            variant="fullWidth"
                            centered
                        >
                            {Object.entries(menuTabs).map(
                                ([, label]) =>
                                    label && (
                                        <Tab
                                            key={label}
                                            value={label}
                                            label={LanguageTranslations[label][language] as string}
                                        />
                                    ),
                            )}
                        </Tabs>

                        {tabOpen === menuTabs.filter && (
                            <form key={JSON.stringify(appliedFilter)} onSubmit={applyFilter}>
                                <Stack spacing={2}>
                                    {Object.keys(filterOptions).map((fieldId) =>
                                        getFilterOptionComp(fieldId as FilterNameType),
                                    )}
                                    <Button type="submit">
                                        {LanguageTranslations.apply[language]}
                                    </Button>
                                    <Button color="error" onClick={() => setAppliedFilter(null)}>
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
                </SwipeableDrawer>
            </Stack>
        </Box>
    );
};

export default KanBanBoardMenu;
