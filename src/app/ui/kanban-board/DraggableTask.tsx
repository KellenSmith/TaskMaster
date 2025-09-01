import { Button, Card, Stack, Tooltip, Typography } from "@mui/material";
import { formatDate, isUserQualifiedForTask, openResourceInNewTab } from "../utils";
import GlobalConstants from "../../GlobalConstants";
import { assignTaskToUser, unassignTaskFromUser } from "../../lib/task-actions";
import { use } from "react";
import ConfirmButton from "../ConfirmButton";
import { useUserContext } from "../../context/UserContext";
import { Prisma } from "@prisma/client";
import { useNotificationContext } from "../../context/NotificationContext";
import LanguageTranslations from "./LanguageTranslations";
import { getRelativeUrl } from "../../lib/definitions";
import { CheckCircle, Delete, Info, OpenInNew, Warning } from "@mui/icons-material";
import {
    doDateRangesOverlap,
    isEventSoldOut,
    isUserParticipant,
} from "../../(pages)/event/event-utils";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";

dayjs.extend(isBetween);

interface DraggableTaskProps {
    readOnly: boolean;
    eventPromise?: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { event_participants: true } } };
        }>
    >;
    task: Prisma.TaskGetPayload<{
        include: {
            assignee: { select: { id: true; nickname: true } };
            skill_badges: true;
        };
    }>;
    setDraggedTask?: (
        // eslint-disable-next-line no-unused-vars
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }> | null,
    ) => void;
}

const DraggableTask = ({ readOnly, eventPromise, task, setDraggedTask }: DraggableTaskProps) => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const event = eventPromise ? use(eventPromise) : null;

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

    const getTaskActionButton = () => {
        if (task.assignee_id === user.id)
            return (
                <ConfirmButton
                    onClick={unassignFromTask}
                    fullWidth
                    color="error"
                    variant="outlined"
                    startIcon={<Delete />}
                    confirmText={LanguageTranslations.areYouSureCancelShiftBooking[language]}
                >
                    {LanguageTranslations.cancelShiftBooking[language]}
                </ConfirmButton>
            );
        if (!isUserQualifiedForTask(user, task.skill_badges))
            return (
                <Tooltip title={LanguageTranslations.unqualifiedForShiftTooltip[language]}>
                    <Warning color="warning" />
                </Tooltip>
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

    return (
        <>
            <Card
                draggable={!readOnly}
                onDragStart={() => setDraggedTask(task)}
                sx={{
                    padding: { xs: 1, sm: 2 },
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
                    direction={{ xs: "column", sm: "row" }}
                    flexWrap="wrap"
                    width="100%"
                    gap={1}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                >
                    <Stack flexWrap="wrap" sx={{ width: { xs: "100%", sm: "auto" } }}>
                        <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                            {task.name}
                        </Typography>
                        <Stack
                            flexWrap="wrap"
                            direction="row"
                            alignItems="center"
                            gap={2}
                            sx={{ mt: 0.5 }}
                        >
                            <Typography variant="body2">{formatDate(task.start_time)}</Typography>
                            <Typography variant="body2">-</Typography>
                            <Typography variant="body2">{formatDate(task.end_time)}</Typography>
                        </Stack>
                    </Stack>

                    <Stack spacing={1} width="100%">
                        <Button
                            variant="outlined"
                            fullWidth
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
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                            {LanguageTranslations.moreInfo[language]}
                        </Button>
                        {getTaskActionButton()}
                    </Stack>
                </Stack>
            </Card>
        </>
    );
};

export default DraggableTask;
