import { CalendarMonth, ExpandMore, Group, LocationOn, Person } from "@mui/icons-material";
import { Accordion, AccordionSummary, Paper, Stack, Typography, useTheme } from "@mui/material";
import { use, useTransition } from "react";
import { formatDate } from "../../ui/utils";
import { isUserHost } from "../../lib/definitions";
import RichTextField from "../../ui/form/RichTextField";
import { useUserContext } from "../../context/UserContext";
import ConfirmButton from "../../ui/ConfirmButton";
import { deleteEventParticipant } from "../../lib/event-actions";
import { useNotificationContext } from "../../context/NotificationContext";
import { Prisma } from "@prisma/client";

interface EventDetailsProps {
    event: Prisma.EventGetPayload<{
        include: { host: { select: { id: true; nickname: true } } };
    }>;
    eventParticipants: Prisma.ParticipantInEventGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[];
    eventReservesPromise: Promise<
        Prisma.ReserveInEventGetPayload<{
            include: { user: { select: { id: true; nickname: true } } };
        }>[]
    >;
}

const EventDetails = ({ event, eventParticipants, eventReservesPromise }: EventDetailsProps) => {
    const theme = useTheme();
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const eventReserves = isUserHost(user, event) ? use(eventReservesPromise) : [];

    const removeUserFromParticipantList = (userId: string) =>
        startTransition(async (): Promise<void> => {
            try {
                await deleteEventParticipant(userId, event.id);
                addNotification("Removed participant", "success");
            } catch {
                addNotification("Failed to remove participant", "error");
            }
        });

    return (
        <Stack spacing={3} sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <CalendarMonth color="primary" />
                        <Typography>
                            From:
                            <br />
                            To:
                        </Typography>
                        <Typography>
                            {formatDate(event.startTime)}
                            <br />
                            {formatDate(event.endTime)}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <LocationOn color="primary" />
                        <Typography>{event.location}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Person color="primary" />
                        <Typography>Host: {event.host.nickname}</Typography>
                    </Stack>
                    <RichTextField editMode={false} defaultValue={event.description} />
                </Stack>
            </Paper>
        </Stack>
    );
};

export default EventDetails;
