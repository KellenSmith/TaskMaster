"use client";

import {
    Accordion,
    Stack,
    Tab,
    Tabs,
    Typography,
    Paper,
    AccordionSummary,
    useTheme,
} from "@mui/material";
import {
    CalendarMonth,
    LocationOn,
    Person,
    AttachMoney,
    ExpandMore,
    Group,
} from "@mui/icons-material";
import GlobalConstants from "../../../GlobalConstants";
import { startTransition, Suspense, useEffect, useState } from "react";
import { isUserHost } from "../../../lib/definitions";
import { useUserContext } from "../../../context/UserContext";
import TaskDashboard from "./(tasks)/TaskDashboard";
import {
    defaultActionState as defaultFormActionState,
    FormActionState,
    getFormActionMsg,
} from "../../../ui/form/Form";
import { deleteEventParticipant } from "../../../lib/event-actions";
import { formatDate } from "../../../ui/utils";
import RichTextField from "../../../ui/form/RichTextField";
import { defaultActionState as defaultDatagridActionState } from "../../../ui/Datagrid";
import { getUserNicknames } from "../../../lib/user-actions";
import { isEventSoldOut } from "./event-utils";
import EventActions from "./EventActions";
import ConfirmButton from "../../../ui/ConfirmButton";

export const tabs = { event: "Event", details: "Details", tasks: "Participate" };

const EventDashboard = ({ event, fetchEventAction, openTab, setOpenTab }) => {
    const theme = useTheme();
    const { user } = useUserContext();
    const [eventActionState, setEventActionState] = useState(defaultFormActionState);
    const [participantNicknames, setParticipantNicknames] = useState<string[]>([]);

    useEffect(() => {
        const fetchParticipantNicknames = async () => {
            if (event.participantUsers?.length > 0) {
                const userIds = event.participantUsers.map((participant) => participant.userId);
                const nicknameResult = await getUserNicknames(userIds, defaultDatagridActionState);
                if (nicknameResult.status === 200) {
                    setParticipantNicknames(nicknameResult.result);
                }
            }
        };
        fetchParticipantNicknames();
    }, [event.participantUsers]);

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
            <Typography variant="h4" color="primary" gutterBottom>
                {`${event[GlobalConstants.TITLE]} ${isEventSoldOut(event) ? "(SOLD OUT)" : ""}`}
            </Typography>
            <Tabs value={openTab} onChange={(_, newTab) => setOpenTab(newTab)}>
                {Object.keys(tabs).map((tab) => (
                    <Tab key={tabs[tab]} value={tabs[tab]} label={tabs[tab]} />
                ))}
            </Tabs>
            {getFormActionMsg(eventActionState)}
            <EventActions
                event={event}
                fetchEventAction={fetchEventAction}
                openTab={openTab}
                setOpenTab={setOpenTab}
            />
            {openTab === tabs.event && (
                <RichTextField editMode={false} value={event[GlobalConstants.DESCRIPTION]} />
            )}
            {openTab === tabs.tasks && (
                <TaskDashboard
                    readOnly={!isUserHost(user, event)}
                    event={event}
                    fetchEventAction={fetchEventAction}
                />
            )}
            {openTab === tabs.details && (
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
                                    <Typography>
                                        Ticket Price: {event.fullTicketPrice} SEK
                                    </Typography>
                                </Stack>
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Group color="primary" sx={{ marginRight: 2 }} />
                                        <Typography>{`Participants (${event.participantUsers.length})`}</Typography>
                                    </AccordionSummary>
                                    <Stack spacing={1} sx={{ overflowY: "auto" }}>
                                        {participantNicknames.map((participant) => (
                                            <Stack
                                                direction="row"
                                                key={participant[GlobalConstants.ID]}
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
                                                    {participant[GlobalConstants.NICKNAME]}
                                                </Stack>
                                                {isUserHost(user, event) &&
                                                    !isUserHost(participant, event) && (
                                                        <ConfirmButton
                                                            size={"small"}
                                                            onClick={async () =>
                                                                removeUserFromParticipantList(
                                                                    participant[GlobalConstants.ID],
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
                            </Stack>
                        </Paper>
                    </Stack>
                </Suspense>
            )}
        </Suspense>
    );
};
export default EventDashboard;
