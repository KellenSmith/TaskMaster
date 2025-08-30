import { Button, Card, Dialog, Stack, Typography } from "@mui/material";
import { formatDate, isUserQualifiedForTask } from "../utils";
import GlobalConstants from "../../GlobalConstants";
import { assignTaskToUser, deleteTask, updateTaskById } from "../../lib/task-actions";
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

interface DraggableTaskProps {
    readOnly: boolean;
    task: Prisma.TaskGetPayload<{
        include: {
            assignee: { select: { id: true; nickname: true } };
            skill_badges: true;
        };
    }>;
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skill_badges: true };
        }>[]
    >;
    skillBadgesPromise: Promise<
        Prisma.SkillBadgeGetPayload<{ select: { id: true; name: true } }>[]
    >;
    setDraggedTask: (
        // eslint-disable-next-line no-unused-vars
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }> | null,
    ) => void;
}

const DraggableTask = ({
    readOnly,
    task,
    activeMembersPromise,
    skillBadgesPromise,
    setDraggedTask,
}: DraggableTaskProps) => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const activeMembers = activeMembersPromise ? use(activeMembersPromise) : [];
    const skillBadges = use(skillBadgesPromise);
    const [dialogOpen, setDialogOpen] = useState(false);

    const deleteTaskAction = async () => {
        try {
            await deleteTask(task.id);
            setDialogOpen(false);
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

    return (
        <>
            <Card
                draggable={!readOnly}
                onDragStart={() => setDraggedTask(task)}
                sx={{
                    padding: 2,
                    cursor: "pointer",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setDialogOpen(true);
                }}
            >
                <Typography variant="body1">{task.name}</Typography>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">{formatDate(task.start_time)}</Typography>
                    {"-"}
                    <Typography variant="body2">{formatDate(task.end_time)}</Typography>
                </Stack>
            </Card>
            <Dialog fullWidth maxWidth="xl" open={dialogOpen} onClose={() => setDialogOpen(false)}>
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
                <Button onClick={assignTaskToMe} disabled={task.assignee_id === user.id}>
                    {LanguageTranslations.bookButtonLabel[language](
                        task.assignee_id === user.id,
                        isUserQualifiedForTask(user, task.skill_badges),
                    )}
                </Button>
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
