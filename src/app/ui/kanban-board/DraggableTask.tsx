import {
    Button,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { formatDate, isUserQualifiedForTask, openResourceInNewTab } from "../utils";
import GlobalConstants from "../../GlobalConstants";
import {
    assignTaskToUser,
    deleteTask,
    unassignTaskFromUser,
    updateTaskById,
} from "../../lib/task-actions";
import Form from "../form/Form";
import { use, useState } from "react";
import ConfirmButton from "../ConfirmButton";
import { useUserContext } from "../../context/UserContext";
import { getUserSelectOptions } from "../form/FieldCfg";
import { Prisma } from "@prisma/client";
import z from "zod";
import { TaskUpdateSchema } from "../../lib/zod-schemas";
import { useNotificationContext } from "../../context/NotificationContext";
import { CustomOptionProps } from "../form/AutocompleteWrapper";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import LanguageTranslations from "./LanguageTranslations";
import RichTextField from "../form/RichTextField";
import { getRelativeUrl, isUserAdmin, isUserHost } from "../../lib/definitions";
import { CheckCircle, Delete, Edit, Info, OpenInNew, Warning } from "@mui/icons-material";

interface DraggableTaskProps {
    readOnly: boolean;
    eventPromise: Promise<Prisma.EventGetPayload<{}>>;
    task: Prisma.TaskGetPayload<{
        include: {
            assignee: { select: { id: true; nickname: true } };
            skill_badges: true;
        };
    }>;
    activeMembersPromise?: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skill_badges: true };
        }>[]
    >;
    skillBadgesPromise?: Promise<
        Prisma.SkillBadgeGetPayload<{ select: { id: true; name: true } }>[]
    >;
    setDraggedTask?: (
        // eslint-disable-next-line no-unused-vars
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }> | null,
    ) => void;
}

const DraggableTask = ({
    readOnly,
    eventPromise,
    task,
    activeMembersPromise,
    skillBadgesPromise,
    setDraggedTask,
}: DraggableTaskProps) => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const event = eventPromise ? use(eventPromise) : null;
    const activeMembers = activeMembersPromise ? use(activeMembersPromise) : [];
    const skillBadges = skillBadgesPromise ? use(skillBadgesPromise) : [];
    const [isOpen, setIsOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const deleteTaskAction = async () => {
        try {
            await deleteTask(task.id);
            setEditDialogOpen(false);
            addNotification(GlobalLanguageTranslations.successfulDelete[language], "success");
        } catch {
            addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
        }
    };

    const updateTaskAction = async (parsedFieldValues: z.infer<typeof TaskUpdateSchema>) => {
        await updateTaskById(task.id, parsedFieldValues, task.event_id);
        return "Updated task";
    };

    const assignTaskToMe = async () => {
        try {
            await assignTaskToUser(user.id, task.id);
            addNotification(LanguageTranslations.bookedTask[language], "success");
        } catch {
            addNotification(LanguageTranslations.failedBookTask[language], "error");
        }
    };

    const unassignFromTask = async () => {
        try {
            await unassignTaskFromUser(user.id, task.id);
            addNotification(LanguageTranslations.unassignedTask[language], "success");
        } catch {
            addNotification(LanguageTranslations.failedUnassignTask[language], "error");
        }
    };

    return (
        <>
            <Card
                draggable={!readOnly}
                onDragStart={() => setDraggedTask(task)}
                sx={{
                    padding: 2,
                    ...(readOnly ? {} : { cursor: "grab" }),
                    transition: "transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        filter: "brightness(1.06)",
                    },
                }}
            >
                <Stack
                    direction="row"
                    flexWrap="wrap"
                    width="100%"
                    gap={1}
                    justifyContent="space-between"
                >
                    <Stack flexWrap="wrap">
                        <Typography variant="body1">{task.name}</Typography>
                        <Stack flexWrap="wrap" direction="row" alignItems="center" gap={2}>
                            <Typography variant="body2">{formatDate(task.start_time)}</Typography>
                            <Typography variant="body2">-</Typography>
                            <Typography variant="body2">{formatDate(task.end_time)}</Typography>
                        </Stack>
                    </Stack>

                    <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
                        {isUserAdmin(user) ||
                            (isUserHost(user, event) && (
                                <Button
                                    startIcon={<Edit />}
                                    onClick={() => setEditDialogOpen(true)}
                                >
                                    {GlobalLanguageTranslations.edit[language]}
                                </Button>
                            ))}
                        <Button
                            variant="outlined"
                            color="info"
                            startIcon={<Info />}
                            endIcon={<OpenInNew />}
                            onClick={() =>
                                openResourceInNewTab(
                                    getRelativeUrl([GlobalConstants.TASK], {
                                        [GlobalConstants.TASK_ID]: task.id,
                                    }),
                                )
                            }
                        >
                            {LanguageTranslations.moreInfo[language]}
                        </Button>
                        {task.assignee_id === user.id ? (
                            <ConfirmButton
                                onClick={unassignFromTask}
                                color="error"
                                variant="outlined"
                                startIcon={<Delete />}
                                confirmText={
                                    LanguageTranslations.areYouSureCancelShiftBooking[language]
                                }
                            >
                                {LanguageTranslations.cancelShiftBooking[language]}
                            </ConfirmButton>
                        ) : isUserQualifiedForTask(user, task.skill_badges) ? (
                            <ConfirmButton
                                onClick={assignTaskToMe}
                                color="success"
                                variant="outlined"
                                startIcon={<CheckCircle />}
                                confirmText={LanguageTranslations.areYouSureBookThisShift[language]}
                            >
                                {LanguageTranslations.bookThisShift[language]}
                            </ConfirmButton>
                        ) : (
                            // TODO: Check what this looks like
                            <Tooltip
                                title={LanguageTranslations.unqualifiedForShiftTooltip[language]}
                            >
                                <Warning color="warning" />
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>
            </Card>
            <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{task.name}</DialogTitle>
                <DialogContent>
                    <Stack direction="row" spacing={4}>
                        <Stack
                            sx={{ position: "relative", width: 300, height: 300, flexShrink: 0 }}
                        ></Stack>
                        <Stack width="100%" spacing={2}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                                    {formatDate(task.start_time)} - {formatDate(task.end_time)}
                                </Typography>
                                {task.tags.map((tag) => (
                                    <Stack sx={{ mt: 2 }}>
                                        <Chip label={tag} color={"info"} />
                                    </Stack>
                                ))}
                            </Stack>
                            <RichTextField defaultValue={task.description} />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsOpen(false)}>
                        {GlobalLanguageTranslations.close[language]}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                fullWidth
                maxWidth="xl"
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
            >
                <Form
                    name={GlobalConstants.TASK}
                    defaultValues={{
                        ...task,
                        skill_badges: (task.skill_badges || []).map((b: any) => b.skill_badge_id),
                    }}
                    customOptions={{
                        [GlobalConstants.ASSIGNEE_ID]: getUserSelectOptions(
                            activeMembers,
                            task.skill_badges,
                        ),
                        [GlobalConstants.REVIEWER_ID]: getUserSelectOptions(
                            activeMembers,
                            task.skill_badges,
                        ),
                        [GlobalConstants.SKILL_BADGES]: skillBadges.map(
                            (b) =>
                                ({
                                    id: b.id,
                                    label: b.name,
                                }) as CustomOptionProps,
                        ),
                    }}
                    action={updateTaskAction}
                    validationSchema={TaskUpdateSchema}
                    readOnly={readOnly}
                    editable={!readOnly}
                />
                {!readOnly && (
                    <ConfirmButton color="error" onClick={deleteTaskAction}>
                        {GlobalLanguageTranslations.delete[language]}
                    </ConfirmButton>
                )}
            </Dialog>
        </>
    );
};

export default DraggableTask;
