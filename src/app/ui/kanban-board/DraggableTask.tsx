import { Button, Card, Dialog, Stack, Typography } from "@mui/material";
import { formatDate } from "../utils";
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

interface DraggableTaskProps {
    readOnly: boolean;
    task: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } } };
    }>;
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{ select: { id: true; nickname: true } }>[]
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
    setDraggedTask,
}: DraggableTaskProps) => {
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const activeMembers = use(activeMembersPromise);
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
                    defaultValues={task}
                    customOptions={{
                        [GlobalConstants.ASSIGNEE_ID]: getUserSelectOptions(activeMembers),
                        [GlobalConstants.REVIEWER_ID]: getUserSelectOptions(activeMembers),
                    }}
                    action={updateTaskAction}
                    validationSchema={TaskUpdateSchema}
                    buttonLabel="save task"
                    readOnly={true}
                    editable={!readOnly}
                />
                <Button onClick={assignTaskToMe} disabled={task.assigneeId === user.id}>
                    {task.assigneeId === user.id ? "This task is assigned to you" : "Assign to me"}
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
