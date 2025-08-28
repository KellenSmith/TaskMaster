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
import { isUserAdmin, isUserHost } from "../../lib/definitions";
import { CustomOptionProps } from "../form/AutocompleteWrapper";

interface DraggableTaskProps {
    eventPromise: Promise<Prisma.EventGetPayload<true>> | undefined;
    readOnly: boolean;
    task: Prisma.TaskGetPayload<{
        include: {
            assignee: { select: { id: true; nickname: true } };
            skillBadges: true;
        };
    }>;
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skillBadges: true };
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
    eventPromise,
    readOnly,
    task,
    activeMembersPromise,
    skillBadgesPromise,
    setDraggedTask,
}: DraggableTaskProps) => {
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const event = eventPromise ? use(eventPromise) : null;
    const activeMembers = activeMembersPromise ? use(activeMembersPromise) : [];
    const skillBadges = use(skillBadgesPromise);
    const [dialogOpen, setDialogOpen] = useState(false);

    const deleteTaskAction = async () => {
        try {
            await deleteTask(task.id);
            setDialogOpen(false);
            addNotification("Deleted task", "success");
        } catch {
            addNotification("Failed to delete task", "error");
        }
    };

    const updateTaskAction = async (parsedFieldValues: z.infer<typeof TaskUpdateSchema>) => {
        await updateTaskById(task.id, parsedFieldValues, task.eventId);
        return "Updated task";
    };

    const assignTaskToMe = async () => {
        try {
            await assignTaskToUser(user.id, task.id);
            addNotification("Assigned task to you", "success");
        } catch {
            addNotification("Failed to assign task", "error");
        }
    };

    return (
        <>
            <Card
                draggable
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
                    <Typography variant="body2">{formatDate(task.startTime)}</Typography>
                    {"-"}
                    <Typography variant="body2">{formatDate(task.endTime)}</Typography>
                </Stack>
            </Card>
            <Dialog fullWidth maxWidth="xl" open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <Form
                    name={GlobalConstants.TASK}
                    defaultValues={{
                        ...task,
                        skillBadges: task.skillBadges.map((b) => b.skillBadgeId),
                    }}
                    customOptions={{
                        [GlobalConstants.ASSIGNEE_ID]: getUserSelectOptions(
                            activeMembers,
                            task.skillBadges,
                        ),
                        [GlobalConstants.REVIEWER_ID]: getUserSelectOptions(
                            activeMembers,
                            task.skillBadges,
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
                    buttonLabel="save task"
                    readOnly={
                        isUserHost(user, event) || isUserAdmin(user) || task.reviewerId === user.id
                    }
                    editable={!readOnly}
                />
                <Button onClick={assignTaskToMe} disabled={task.assigneeId === user.id}>
                    {task.assigneeId === user.id
                        ? "This task is assigned to you"
                        : isUserQualifiedForTask(user, task.skillBadges)
                          ? "Assign to me"
                          : "You don't have the skills for this task yet"}
                </Button>
                {!readOnly && (
                    <ConfirmButton color="error" onClick={deleteTaskAction}>
                        delete
                    </ConfirmButton>
                )}
            </Dialog>
        </>
    );
};

export default DraggableTask;
