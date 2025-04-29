"use client";

import {
    Accordion,
    Button,
    Dialog,
    Stack,
    Tab,
    Tabs,
    Typography,
    Box,
    Chip,
    Paper,
    Avatar,
    AccordionSummary,
} from "@mui/material";
import {
    CalendarMonth,
    LocationOn,
    Person,
    Groups,
    AttachMoney,
    ExpandMore,
    Group,
    Cancel,
} from "@mui/icons-material";
import GlobalConstants from "../../../GlobalConstants";
import { startTransition, Suspense, useEffect, useState } from "react";
import { isUserAdmin, isUserHost } from "../../../lib/definitions";
import { useUserContext } from "../../../context/UserContext";
import TaskDashboard from "./(tasks)/TaskDashboard";
import Form, {
    defaultActionState as defaultFormActionState,
    FormActionState,
    getFormActionMsg,
} from "../../../ui/form/Form";
import { deleteEvent, deleteEventParticipant, updateEvent } from "../../../lib/event-actions";
import { Prisma } from "@prisma/client";
import ConfirmButton from "../../../ui/ConfirmButton";
import { useRouter } from "next/navigation";
import { formatDate, navigateToRoute } from "../../../ui/utils";
import RichTextField from "../../../ui/form/RichTextField";
import { defaultActionState as defaultDatagridActionState } from "../../../ui/Datagrid";
import { getUserNicknames } from "../../../lib/user-actions";

export const tabs = { event: "Event", details: "Details", tasks: "Participate" };

const EventDashboard = ({ event, fetchEventAction, openTab, setOpenTab }) => {
    const { user } = useUserContext();
    const [eventActionState, setEventActionState] = useState(defaultFormActionState);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [participantNicknames, setParticipantNicknames] = useState<string[]>([]);
    const router = useRouter();

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

    const changeTab = async (newTab) => {
        setOpenTab(newTab);
    };

    const updateEventById = async (
        currentActionState: FormActionState,
        fieldValues: Prisma.EventUpdateInput,
    ) => {
        const updateEventResult = await updateEvent(
            event[GlobalConstants.ID],
            currentActionState,
            fieldValues,
        );
        startTransition(() => {
            fetchEventAction();
        });
        return updateEventResult;
    };

    const publishEvent = async () => {
        const updateData: Prisma.EventUpdateInput = { status: GlobalConstants.PUBLISHED };
        const publishEventResult = await updateEventById(defaultFormActionState, updateData);
        setEventActionState(publishEventResult);
    };

    const deleteEventAndRedirect = async () => {
        const deleteResult = await deleteEvent(event[GlobalConstants.ID], defaultFormActionState);
        if (deleteResult.status !== 200) return setEventActionState(deleteResult);
        // Redirect to calendar when event is deleted
        navigateToRoute(`/${GlobalConstants.CALENDAR}`, router);
    };

    const getHostNickname = () => {
        const host = participantNicknames.find(
            (user) => user[GlobalConstants.ID] === event[GlobalConstants.HOST_ID],
        );
        return host ? host[GlobalConstants.NICKNAME] : "Unknown";
    };

    const removeUserFromParticipantList = async (userId: string) => {
        const deleteParticipantResult = await deleteEventParticipant(
            userId,
            event[GlobalConstants.ID],
            defaultFormActionState,
        );
        setEventActionState(deleteParticipantResult);
        startTransition(() => {
            fetchEventAction();
        });
    };

    const getActionButtons = () => {
        const ActionButtons = [];
        if (isUserHost) {
            if (event[GlobalConstants.STATUS] === GlobalConstants.DRAFT) {
                ActionButtons.push(
                    <Button key="publish" color="success" onClick={publishEvent}>
                        publish
                    </Button>,
                );
            }
            ActionButtons.push(
                <Button key="edit" onClick={() => setEditDialogOpen(true)}>
                    edit event details
                </Button>,
                <ConfirmButton key="delete" color="error" onClick={deleteEventAndRedirect}>
                    delete
                </ConfirmButton>,
            );
        } else {
            ActionButtons.push(
                <ConfirmButton
                    key="leave"
                    onClick={async () =>
                        await removeUserFromParticipantList(user[GlobalConstants.ID])
                    }
                >
                    leave participant list
                </ConfirmButton>,
            );
        }
        return ActionButtons;
    };

    return (
        <Suspense>
            <Typography variant="h4" color="primary" gutterBottom>
                {event.title}
            </Typography>
            {getFormActionMsg(eventActionState)}
            <Tabs value={openTab} onChange={(_, newTab) => changeTab(newTab)}>
                {Object.keys(tabs).map((tab) => (
                    <Tab key={tabs[tab]} value={tabs[tab]} label={tabs[tab]} />
                ))}
            </Tabs>
            {getActionButtons()}
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
                                                key={participant[GlobalConstants.ID]}
                                                direction="row"
                                                alignItems="center"
                                                justifyContent={"space-between"}
                                                padding={2}
                                            >
                                                <Stack direction="row">
                                                    <Person
                                                        color="primary"
                                                        sx={{ marginRight: 2 }}
                                                    />
                                                    {participant[GlobalConstants.NICKNAME]}
                                                </Stack>
                                                {isUserHost(participant, event) && (
                                                    <Cancel
                                                        sx={{ padding: 2, cursor: "pointer" }}
                                                        onClick={async () =>
                                                            removeUserFromParticipantList(
                                                                participant[GlobalConstants.ID],
                                                            )
                                                        }
                                                    />
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

            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                fullWidth
                maxWidth="xl"
            >
                <Form
                    name={GlobalConstants.EVENT}
                    buttonLabel="save"
                    readOnly={false}
                    action={updateEventById}
                    defaultValues={event}
                    editable={isUserHost(user, event)}
                />
                <Button onClick={() => setEditDialogOpen(false)}>cancel</Button>
            </Dialog>
        </Suspense>
    );
};
export default EventDashboard;
