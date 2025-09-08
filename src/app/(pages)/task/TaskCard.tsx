import {
    Button,
    Card,
    CardContent,
    Stack,
    Typography,
    Chip,
    Box,
    Tooltip,
    Dialog,
    Avatar,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { formatDate } from "../../ui/utils";
import GlobalConstants from "../../GlobalConstants";
import { clientRedirect } from "../../lib/utils";
import { useUserContext } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import { FC, use, useState } from "react";
import { Prisma } from "@prisma/client";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import Form from "../../ui/form/Form";
import { ContactMemberSchema, TaskUpdateSchema } from "../../lib/zod-schemas";
import { contactTaskMember, deleteTask, updateTaskById } from "../../lib/task-actions";
import { getUserSelectOptions } from "../../ui/form/FieldCfg";
import { CustomOptionProps } from "../../ui/form/AutocompleteWrapper";
import ConfirmButton from "../../ui/ConfirmButton";
import { LocalPolice, Warning } from "@mui/icons-material";
import { implementedTabs } from "../profile/LanguageTranslations";
import { useNotificationContext } from "../../context/NotificationContext";
import LanguageTranslations from "./LanguageTranslations";

interface TaskCardProps {
    taskPromise: Promise<
        Prisma.TaskGetPayload<{
            include: {
                assignee: { select: { id: true; nickname: true } };
                reviewer: { select: { id: true; nickname: true } };
                skill_badges: true;
            };
        }>
    >;
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<{}>[]>;
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skill_badges: true };
        }>[]
    >;
}

const TaskCard: FC<TaskCardProps> = ({ taskPromise, skillBadgesPromise, activeMembersPromise }) => {
    const { user, language } = useUserContext();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const { addNotification } = useNotificationContext();
    const router = useRouter();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [messageRecipientId, setMessageRecipientId] = useState<string | null>(null);
    const task = use(taskPromise);
    const skillBadges = use(skillBadgesPromise);
    const activeMembers = use(activeMembersPromise);

    if (!user) return null;

    const getStatusColor = () => {
        const status = task.status;
        if (!status) return "default" as any;
        if (status === GlobalConstants.TO_DO) return "info" as any;
        if (status === GlobalConstants.IN_PROGRESS) return "warning" as any;
        if (status === GlobalConstants.IN_REVIEW) return "secondary" as any;
        if (status === GlobalConstants.DONE) return "success" as any;
        return "default" as any;
    };

    const updateTaskAction = async (formData: FormData) => {
        try {
            await updateTaskById(task.id, formData, task.event_id);
            setEditDialogOpen(false);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const contactMemberAction = async (formData: FormData) => {
        try {
            await contactTaskMember(messageRecipientId, formData, task.id);
            setMessageRecipientId(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const deleteTaskAction = async () => {
        try {
            await deleteTask(task.id);
            addNotification(GlobalLanguageTranslations.successfulDelete[language], "success");
            clientRedirect(router, [
                task.event_id ? GlobalConstants.CALENDAR : GlobalConstants.TASKS,
            ]);
        } catch {
            addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
        }
    };

    const getDialogForm = () => {
        if (messageRecipientId) {
            return (
                <>
                    <Card sx={{ p: 2 }}>
                        <Warning color="warning" />
                        <Typography variant="caption" sx={{ p: 2 }} color="warning">
                            {LanguageTranslations.privacyWarning[language]}
                        </Typography>
                    </Card>
                    <Form
                        name={GlobalConstants.CONTACT_MEMBER}
                        validationSchema={ContactMemberSchema}
                        action={contactMemberAction}
                        defaultValues={{
                            [GlobalConstants.CONTENT]: LanguageTranslations.messagePrompt[language],
                        }}
                        editable={true}
                        readOnly={false}
                    />
                </>
            );
        }
        return (
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
                readOnly={false}
                editable={true}
            />
        );
    };

    return (
        <>
            <Card
                key={task.id}
                sx={{
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 3,
                    },
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                        <Stack
                            direction={isSmallScreen ? "column" : "row"}
                            justifyContent="space-between"
                            alignItems="center"
                            width="100%"
                        >
                            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                                {task.name}
                            </Typography>
                            {task.skill_badges && task.skill_badges.length > 0 && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Required Skill Badges:
                                    </Typography>
                                    {task.skill_badges.map((badge) => (
                                        <Tooltip
                                            title={
                                                skillBadges.find(
                                                    (b) => b.id === badge.skill_badge_id,
                                                )?.name || ""
                                            }
                                            key={badge.skill_badge_id}
                                        >
                                            <Avatar
                                                sx={{ cursor: "pointer", height: 24, width: 24 }}
                                                color="primary"
                                                onClick={() =>
                                                    clientRedirect(
                                                        router,
                                                        [GlobalConstants.PROFILE],
                                                        {
                                                            tab: implementedTabs.skill_badges,
                                                        },
                                                    )
                                                }
                                            >
                                                <LocalPolice />
                                            </Avatar>
                                        </Tooltip>
                                    ))}
                                </Stack>
                            )}
                            <Chip
                                variant="outlined"
                                color={getStatusColor()}
                                label={task.status}
                                size="small"
                            />
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                            <Stack spacing={1}>
                                {task.start_time && (
                                    <Typography color="text.secondary">
                                        <strong>Start:</strong> {formatDate(task.start_time)}
                                    </Typography>
                                )}
                                {task.end_time && (
                                    <Typography color="text.secondary">
                                        <strong>End:</strong> {formatDate(task.end_time)}
                                    </Typography>
                                )}
                                {task.assignee?.nickname && (
                                    <Typography color="text.secondary">
                                        <strong>Assignee:</strong> {task.assignee.nickname}
                                    </Typography>
                                )}
                                {task.reviewer?.nickname && (
                                    <Typography color="text.secondary">
                                        <strong>Reviewer:</strong> {task.reviewer.nickname}
                                    </Typography>
                                )}
                                {task.tags && task.tags.length > 0 && (
                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                        {task.tags.map((t) => (
                                            <Chip key={t} label={t} size="small" />
                                        ))}
                                    </Box>
                                )}
                                {task.description && (
                                    <Typography color="text.secondary">
                                        {task.description}
                                    </Typography>
                                )}
                            </Stack>
                        </Stack>
                        <Stack width="100%" justifyContent="space-between">
                            {task.event_id && (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="small"
                                    onClick={() =>
                                        clientRedirect(router, [GlobalConstants.CALENDAR_POST], {
                                            [GlobalConstants.EVENT_ID]: task.event_id,
                                        })
                                    }
                                    sx={{ minWidth: 80 }}
                                >
                                    View event
                                </Button>
                            )}
                            <Button
                                fullWidth
                                onClick={() => setMessageRecipientId(task.assignee?.id)}
                            >
                                {LanguageTranslations.contactAssignee[language]}
                            </Button>
                            <Button
                                fullWidth
                                onClick={() => setMessageRecipientId(task.reviewer?.id)}
                            >
                                {LanguageTranslations.contactReviewer[language]}
                            </Button>
                            {task.reviewer_id === user.id && (
                                <>
                                    <Button fullWidth onClick={() => setEditDialogOpen(true)}>
                                        {GlobalLanguageTranslations.edit[language]}
                                    </Button>
                                    <ConfirmButton
                                        fullWidth
                                        onClick={deleteTaskAction}
                                        color="error"
                                        variant="outlined"
                                        size="small"
                                    >
                                        {GlobalLanguageTranslations.delete[language]}
                                    </ConfirmButton>
                                </>
                            )}
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
            <Dialog
                fullScreen={isSmallScreen}
                fullWidth
                maxWidth="xl"
                open={editDialogOpen || !!messageRecipientId}
                onClose={() => setEditDialogOpen(false)}
            >
                {getDialogForm()}
                <Button
                    onClick={() => {
                        setEditDialogOpen(false);
                        setMessageRecipientId(null);
                    }}
                >
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </>
    );
};

export default TaskCard;
