import {
    AttachMoney,
    CalendarMonth,
    ExpandMore,
    Group,
    LocationOn,
    Person,
} from "@mui/icons-material";
import { Accordion, AccordionSummary, Paper, Stack, Typography, useTheme } from "@mui/material";
import { startTransition, Suspense } from "react";
import { formatDate } from "../../../ui/utils";
import GlobalConstants from "../../../GlobalConstants";
import { defaultFormActionState, FormActionState, isUserHost } from "../../../lib/definitions";
import RichTextField from "../../../ui/form/RichTextField";
import { useUserContext } from "../../../context/UserContext";
import ConfirmButton from "../../../ui/ConfirmButton";
import { deleteEventParticipant } from "../../../lib/event-actions";

const EventDetails = ({ event, fetchEventAction, setEventActionState }) => {
    const theme = useTheme();
    const { user } = useUserContext();

    const getHostNickname = () => {
        if (!event) return "Pending";
        const host = event[GlobalConstants.HOST];
        return host[GlobalConstants.NICKNAME];
    };

    const removeUserFromParticipantList = async (userId: string): Promise<FormActionState> => {
        const deleteParticipantResult = await deleteEventParticipant(
            userId,
            event[GlobalConstants.ID],
            defaultFormActionState,
        );
        setEventActionState(deleteParticipantResult);
        if (deleteParticipantResult.status === 200) {
            startTransition(() => {
                fetchEventAction();
            });
        }
        return deleteParticipantResult;
    };

    return (
        <Suspense>
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
                                {formatDate(event[GlobalConstants.START_TIME])}
                                <br />
                                {formatDate(event[GlobalConstants.END_TIME])}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <LocationOn color="primary" />
                            <Typography>{event.location}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Person color="primary" />
                            <Typography>Host: {getHostNickname()}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <AttachMoney color="primary" />
                            <Typography>Ticket Price: {event.fullTicketPrice} SEK</Typography>
                        </Stack>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Group color="primary" sx={{ marginRight: 2 }} />
                                <Typography>{`Participants (${event.participantUsers.length})`}</Typography>
                            </AccordionSummary>
                            <Stack spacing={1} sx={{ overflowY: "auto" }}>
                                {event[GlobalConstants.PARTICIPANT_USERS].map((participant) => (
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
                                            {participant.User[GlobalConstants.NICKNAME]}
                                        </Stack>
                                        {isUserHost(user, event) &&
                                            !isUserHost(participant.User, event) && (
                                                <ConfirmButton
                                                    size={"small"}
                                                    onClick={async () =>
                                                        removeUserFromParticipantList(
                                                            participant.User[GlobalConstants.ID],
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
                                    <Typography>{`Reserves (${event[GlobalConstants.RESERVE_USERS].length})`}</Typography>
                                </Stack>
                            </Paper>
                        )}
                        <RichTextField
                            editMode={false}
                            value={event[GlobalConstants.DESCRIPTION]}
                        />
                    </Stack>
                </Paper>
            </Stack>
        </Suspense>
    );
};

export default EventDetails;
