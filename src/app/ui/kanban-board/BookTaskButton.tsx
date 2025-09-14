"use client";
import { Prisma } from "@prisma/client";
import { useUserContext } from "../../context/UserContext";
import ConfirmButton from "../ConfirmButton";
import LanguageTranslations from "./LanguageTranslations";
import { CheckCircle, Delete, Warning } from "@mui/icons-material";
import { assignTaskToUser, unassignTaskFromUser } from "../../lib/task-actions";
import { useNotificationContext } from "../../context/NotificationContext";
import { isUserQualifiedForTask } from "../utils";
import { Stack, Tooltip, Typography } from "@mui/material";
import {
    doDateRangesOverlap,
    isEventSoldOut,
    isUserParticipant,
} from "../../(pages)/calendar-post/event-utils";

interface BookTaskButtonProps {
    event?: Prisma.EventGetPayload<{
        include: { tickets: { include: { event_participants: true } } };
    }>;
    task: Prisma.TaskGetPayload<{
        include: {
            assignee: { select: { id: true; nickname: true } };
            skill_badges: true;
        };
    }>;
}

const BookTaskButton = ({ task, event }: BookTaskButtonProps) => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();

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

    if (!user) return null;
    if (task.assignee_id)
        return (
            <ConfirmButton
                onClick={unassignFromTask}
                disabled={task.assignee_id !== user.id}
                fullWidth
                color="error"
                variant="outlined"
                startIcon={<Delete />}
                confirmText={LanguageTranslations.areYouSureCancelShiftBooking[language](event)}
            >
                {task.assignee_id === user.id
                    ? LanguageTranslations.cancelShiftBooking[language]
                    : LanguageTranslations.booked[language]}
            </ConfirmButton>
        );

    if (!isUserQualifiedForTask(user, task.skill_badges))
        return (
            <Stack direction="row" alignItems="center" gap={1}>
                <Warning color="warning" />
                <Typography variant="caption" color="warning.main">
                    {LanguageTranslations.unqualifiedForShiftTooltip[language]}
                </Typography>
            </Stack>
        );

    if (
        event &&
        isEventSoldOut(event) &&
        !isUserParticipant(user, event) &&
        doDateRangesOverlap(event.start_time, event.end_time, task.start_time, task.end_time)
    )
        return (
            <Tooltip title={LanguageTranslations.eventSoldOutTooltip[language]}>
                <Warning color="warning" />
            </Tooltip>
        );

    let confirmText = LanguageTranslations.areYouSureBookThisShift[language];
    if (event) {
        if (isEventSoldOut(event) && !isUserParticipant(user, event)) {
            confirmText = LanguageTranslations.areYouSureBookThisSoldOutEventShift[language];
        } else confirmText = LanguageTranslations.areYouSureBookThisEventShift[language];
    }
    return (
        <ConfirmButton
            onClick={assignTaskToMe}
            fullWidth
            color="success"
            variant="outlined"
            startIcon={<CheckCircle />}
            confirmText={confirmText}
        >
            {LanguageTranslations.bookThisShift[language]}
        </ConfirmButton>
    );
};

export default BookTaskButton;
