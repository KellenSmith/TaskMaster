import { CalendarMonth, ExpandMore, Group, LocationOn, Person } from "@mui/icons-material";
import { Accordion, AccordionSummary, Paper, Stack, Typography, useTheme } from "@mui/material";
import { use } from "react";
import { formatDate } from "../../ui/utils";
import GlobalConstants from "../../GlobalConstants";
import { defaultFormActionState, FormActionState, isUserHost } from "../../lib/definitions";
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
        include: { User: { select: { id: true; nickname: true } } };
    }>[];
    eventReservesPromise: Promise<
        Prisma.ReserveInEventGetPayload<{
            include: { User: { select: { id: true; nickname: true } } };
        }>[]
    >;
}

const EventDetails = ({ event, eventParticipants, eventReservesPromise }: EventDetailsProps) => {
    const theme = useTheme();
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const eventReserves = isUserHost(user, event) ? use(eventReservesPromise) : [];

    const removeUserFromParticipantList = async (userId: string): Promise<FormActionState> => {
        const deleteParticipantResult = await deleteEventParticipant(
            userId,
            event.id,
            defaultFormActionState,
        );
        if (deleteParticipantResult.status === 200)
            addNotification("Removed participant", "success");
        else addNotification("Failed to remove participant", "error");
        return deleteParticipantResult;
    };

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
                                    key={participant.User[GlobalConstants.ID]}
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
                                        {participant.User.nickname}
                                    </Stack>
                                    {isUserHost(user, event) &&
                                        !isUserHost(participant.User, event) && (
                                            <ConfirmButton
                                                size={"small"}
                                                onClick={async () =>
                                                    removeUserFromParticipantList(
                                                        participant.User.id,
                                                    )
                                                }
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
