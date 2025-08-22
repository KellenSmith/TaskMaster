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
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Group color="primary" sx={{ marginRight: 2 }} />
                            <Typography>{`Participants (${eventParticipants.length})`}</Typography>
                        </AccordionSummary>
                        <Stack spacing={1} sx={{ overflowY: "auto" }}>
                            {eventParticipants.map((participant) => (
                                <Stack
                                    direction="row"
                                    key={participant.user.id}
                                    sx={{
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        paddingLeft: 2,
                                        paddingRight: 2,
                                        "&:hover": {
                                            backgroundColor: theme.palette.divider,
                                        },
                                    }}
                                >
                                    <Stack direction="row" alignItems="center">
                                        <Person color="primary" />
                                        {participant.user.nickname}
                                    </Stack>
                                    {isUserHost(user, event) &&
                                        !isUserHost(participant.user, event) && (
                                            <ConfirmButton
                                                size={"small"}
                                                onClick={() =>
                                                    removeUserFromParticipantList(
                                                        participant.user.id,
                                                    )
                                                }
                                                disabled={isPending}
                                            >
                                                delete
                                            </ConfirmButton>
                                        )}
                                </Stack>
                            ))}
                        </Stack>
                    </Accordion>
                    {isUserHost(user, event) && (
                        <Paper elevation={1} sx={{ padding: 2 }}>
                            <Stack direction="row">
                                <Group color="primary" sx={{ marginRight: 2 }} />
                                <Typography>{`Reserves (${eventReserves.length})`}</Typography>
                            </Stack>
                        </Paper>
                    )}
                    <RichTextField editMode={false} defaultValue={event.description} />
                </Stack>
            </Paper>
        </Stack>
    );
};

export default EventDetails;
