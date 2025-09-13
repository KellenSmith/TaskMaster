import {
    Button,
    Dialog,
    Divider,
    IconButton,
    Paper,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { createTask, updateTaskById } from "../../lib/task-actions";
import Form from "../form/Form";
import { use, useMemo, useState } from "react";
import { Add } from "@mui/icons-material";
import { getUserSelectOptions, stringsToSelectOptions } from "../form/FieldCfg";
import { Prisma, Task, TaskStatus } from "@prisma/client";
import dayjs from "dayjs";
import z from "zod";
import { TaskCreateSchema, TaskFilterSchema } from "../../lib/zod-schemas";
import { useNotificationContext } from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";
import DraggableTaskShifts from "./DraggableTaskShifts";
import { CustomOptionProps } from "../form/AutocompleteWrapper";
import { getGroupedAndSortedTasks } from "../../(pages)/calendar-post/event-utils";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import LanguageTranslations from "./LanguageTranslations";
import { getFilteredTasks } from "./KanBanBoardMenu";

interface DroppableColumnProps {
    readOnly: boolean;
    eventPromise?: Promise<
        Prisma.EventGetPayload<{ include: { tickets: { include: { event_participants: true } } } }>
    >;
    status: TaskStatus;
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
        }>[]
    >;
    appliedFilter: z.infer<typeof TaskFilterSchema> | null;
    activeMembersPromise?: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skill_badges: true };
        }>[]
    >;
    skillBadgesPromise?: Promise<
        Prisma.SkillBadgeGetPayload<{ select: { id: true; name: true } }>[]
    >;
    draggedTask: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } } };
    }> | null;
    setDraggedTask: (
        // eslint-disable-next-line no-unused-vars
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }> | null,
    ) => void;
    draggedOverColumn: TaskStatus | null;
    setDraggedOverColumn: (column: TaskStatus | null) => void; // eslint-disable-line no-unused-vars
}

const DroppableColumn = ({
    readOnly,
    eventPromise,
    status,
    tasksPromise,
    appliedFilter,
    activeMembersPromise,
    skillBadgesPromise,
    draggedTask,
    setDraggedTask,
    draggedOverColumn,
    setDraggedOverColumn,
}: DroppableColumnProps) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [taskFormDefaultValues, setTaskFormDefaultValues] = useState(null);
    const event = eventPromise ? use(eventPromise) : null;
    const activeMembers = activeMembersPromise ? use(activeMembersPromise) : [];
    const skillBadges = use(skillBadgesPromise);
    const tasks = use(tasksPromise);
    const filteredTasks = useMemo(
        () =>
            getFilteredTasks(
                appliedFilter,
                tasks.filter((task) => task.status === status),
                user.id,
            ),
        [appliedFilter, tasks, status, user.id],
    );

    const handleDrop = async (status: TaskStatus) => {
        if (draggedTask?.status !== status) {
            try {
                const statusFormData = new FormData();
                statusFormData.append(GlobalConstants.STATUS, status);
                await updateTaskById(draggedTask.id, statusFormData);
                addNotification(
                    `${LanguageTranslations.taskSetTo[language]} "${LanguageTranslations[status][language]}"`,
                    "success",
                );
            } catch {
                addNotification(GlobalLanguageTranslations.failedSave[language], "error");
            }
        }
        setDraggedTask(null);
        setDraggedOverColumn(null);
    };

    const getTaskDefaultStartTime = (): Date =>
        (event ? dayjs.utc(event.start_time) : dayjs.utc().minute(0)).toDate();

    const getTaskDefaultEndTime = (): Date =>
        (event ? dayjs.utc(event.end_time) : dayjs.utc().minute(0)).toDate();

    const openCreateTaskDialog = (shiftProps: Task | null) => {
        const defaultTask = {
            status,
            reviewer_id: user.id,
            start_time: getTaskDefaultStartTime(),
            end_time: getTaskDefaultEndTime(),
            ...shiftProps,
        } as Task;
        setTaskFormDefaultValues(defaultTask);
    };

    const createTaskAndCloseDialog = async (formData: FormData): Promise<string> => {
        if (event) formData.append(GlobalConstants.EVENT_ID, event.id);
        try {
            await createTask(formData);
            setTaskFormDefaultValues(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    return (
        <>
            <Paper
                elevation={3}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDraggedOverColumn(status);
                }}
                onDrop={() => handleDrop(status)}
                sx={{
                    height: "100%",
                    padding: isSmallScreen ? "8px" : "16px",
                    // make columns scrollable on small screens so content doesn't overflow the viewport
                    overflowY: isSmallScreen ? "auto" : undefined,
                    maxHeight: isSmallScreen ? "calc(100vh - 120px)" : undefined,
                    touchAction: "manipulation",
                    ...(draggedOverColumn === status && {
                        backgroundColor: theme.palette.primary.light,
                    }),
                }}
            >
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={isSmallScreen ? 1 : 0}
                >
                    <Typography variant={isSmallScreen ? "subtitle1" : "h6"}>
                        {LanguageTranslations[status][language].toUpperCase()}
                    </Typography>
                    {!readOnly && (
                        <IconButton
                            onClick={() => openCreateTaskDialog(null)}
                            size={isSmallScreen ? "large" : "medium"}
                            aria-label={GlobalLanguageTranslations.save[language]}
                        >
                            <Add />
                        </IconButton>
                    )}
                </Stack>
                <Divider />
                <Stack spacing={2} sx={{ width: "100%" }}>
                    {getGroupedAndSortedTasks<
                        Prisma.TaskGetPayload<{
                            include: {
                                assignee: { select: { id: true; nickname: true } };
                                skill_badges: true;
                            };
                        }>
                    >(filteredTasks).map((taskList) => (
                        <DraggableTaskShifts
                            key={taskList.map((task) => task.id).join("-")}
                            readOnly={readOnly}
                            taskList={taskList}
                            eventPromise={eventPromise}
                            setDraggedTask={setDraggedTask}
                            openCreateTaskDialog={openCreateTaskDialog}
                        />
                    ))}
                </Stack>
            </Paper>
            <Dialog
                fullWidth
                maxWidth="xl"
                fullScreen={isSmallScreen}
                open={!!taskFormDefaultValues}
                onClose={() => setTaskFormDefaultValues(null)}
            >
                <Form
                    name={GlobalConstants.TASK}
                    action={createTaskAndCloseDialog}
                    validationSchema={TaskCreateSchema}
                    defaultValues={
                        taskFormDefaultValues
                            ? {
                                  ...taskFormDefaultValues,
                                  skill_badges: taskFormDefaultValues.skill_badges?.map(
                                      (b: any) => b.skill_badge_id,
                                  ),
                              }
                            : null
                    }
                    customOptions={{
                        [GlobalConstants.ASSIGNEE_ID]: getUserSelectOptions(
                            activeMembers,
                            taskFormDefaultValues?.skill_badges || [],
                        ),
                        [GlobalConstants.REVIEWER_ID]: getUserSelectOptions(activeMembers),
                        [GlobalConstants.SKILL_BADGES]: skillBadges.map(
                            (b) =>
                                ({
                                    id: b.id,
                                    label: b.name,
                                }) as CustomOptionProps,
                        ),
                        [GlobalConstants.TAGS]: stringsToSelectOptions([
                            ...new Set(tasks.flatMap((t) => t.tags || [])),
                        ]),
                    }}
                    buttonLabel={GlobalLanguageTranslations.save[language]}
                    readOnly={false}
                    editable={false}
                />
                <Button onClick={() => setTaskFormDefaultValues(null)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </>
    );
};

export default DroppableColumn;
