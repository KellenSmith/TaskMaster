"use client";
import {
    List,
    ListItem,
    ListSubheader,
    Stack,
    Chip,
    ListItemAvatar,
    ListItemText,
    Divider,
    useTheme,
    Dialog,
    IconButton,
} from "@mui/material";
import { Prisma } from "@prisma/client";
import { use, useState, useTransition } from "react";
import { isUserHost } from "../../lib/definitions";
import { Add, Delete, Person } from "@mui/icons-material";
import { Button } from "@react-email/components";
import { FieldLabels, getUserSelectOptions } from "../../ui/form/FieldCfg";
import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { addEventParticipant, deleteEventParticipant } from "../../lib/event-participant-actions";
import z from "zod";
import { AddEventParticipantSchema, AddEventReserveSchema } from "../../lib/zod-schemas";
import { addEventReserve, deleteEventReserve } from "../../lib/event-reserve-actions";
import { CustomOptionProps } from "../../ui/form/AutocompleteWrapper";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import { useNotificationContext } from "../../context/NotificationContext";

interface ParticipantDashboard {
    eventPromise: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { event_participants: true } }; event_reserves: true };
        }>
    >;
    eventParticipantsPromise: Promise<
        Prisma.EventParticipantGetPayload<{
            include: { user: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventReservesPromise: Promise<
        Prisma.EventReserveGetPayload<{
            include: { user: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventTicketsPromise: Promise<Prisma.TicketGetPayload<{ include: { product: true } }>[]>;
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{ select: { id: true; nickname: true; skill_badges: true } }>[]
    >;
}

const ParticipantDashboard = ({
    eventPromise,
    eventParticipantsPromise,
    eventReservesPromise,
    eventTicketsPromise,
    activeMembersPromise,
}: ParticipantDashboard) => {
    const theme = useTheme();
    const { addNotification } = useNotificationContext();
    const event = use(eventPromise);
    const eventParticipants = use(eventParticipantsPromise);
    const eventReserves = use(eventReservesPromise);
    const tickets = use(eventTicketsPromise);
    const activeMembers = use(activeMembersPromise);
    const [addDialogOpen, setAddDialogOpen] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const addEventParticipantAction = async (
        parsedFieldValues: z.infer<typeof AddEventParticipantSchema>,
    ) => {
        try {
            // parsedFieldValues uses camelCase from the form; normalize when calling actions
            await addEventParticipant(parsedFieldValues.userId, parsedFieldValues.ticketId);
            return "Added participant";
        } catch {
            throw new Error("Failed to add participant");
        }
    };

    const deleteEventParticipantAction = async (userId: string) => {
        startTransition(async () => {
            try {
                await deleteEventParticipant(event.id, userId);
                addNotification("Deleted participant", "success");
            } catch {
                addNotification("Failed to delete participant", "error");
            }
        });
    };

    const addEventReserveAction = async (
        parsedFieldValues: z.infer<typeof AddEventReserveSchema>,
    ) => {
        try {
            await addEventReserve(parsedFieldValues.userId, event.id);
            return "Added reserve";
        } catch {
            throw new Error("Failed to add reserve");
        }
    };

    const deleteEventReserveAction = async (userId: string) => {
        startTransition(async () => {
            try {
                await deleteEventReserve(userId, event.id);
                addNotification("Deleted reserve", "success");
            } catch {
                addNotification("Failed to delete reserve", "error");
            }
        });
    };

    const UserList = ({
        name,
        users,
    }: {
        name: string;
        users: typeof eventParticipants | typeof eventReserves;
    }) => (
        <List sx={{ minWidth: 200 }}>
            <ListSubheader>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    {FieldLabels[name]}
                    <Button onClick={() => setAddDialogOpen(name)}>
                        <Add sx={{ cursor: "pointer" }} />
                    </Button>
                </Stack>
            </ListSubheader>
            <Divider />
            {users
                .sort((a, b) => a.user.nickname.localeCompare(b.user.nickname))
                .map((p: (typeof users)[0]) => {
                    return (
                        <ListItem key={String(p.user.id)} disableGutters alignItems="center">
                            <Stack
                                direction="row"
                                width="100%"
                                spacing={1}
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <ListItemAvatar sx={{ display: "flex", justifyContent: "center" }}>
                                    <Person sx={{ color: theme.palette.primary.main }} />
                                </ListItemAvatar>
                                <ListItemText primary={p.user.nickname} />
                                {isUserHost(p.user, event) && (
                                    <Chip label="Host" color="primary" size="small" />
                                )}

                                <IconButton
                                    onClick={async () =>
                                        name === GlobalConstants.PARTICIPANT_USERS
                                            ? deleteEventParticipantAction(p.user.id)
                                            : deleteEventReserveAction(p.user.id)
                                    }
                                    size="small"
                                >
                                    <Delete sx={{ color: theme.palette.error.dark }} />
                                </IconButton>
                            </Stack>
                        </ListItem>
                    );
                })}
        </List>
    );

    const getTicketsOptions = () =>
        tickets.map((t) => ({ id: t.id, label: t.product.name }) as CustomOptionProps);

    return (
        <>
            <Stack direction="row" justifyContent="space-around" spacing={2}>
                {isPending ? (
                    <LoadingFallback />
                ) : (
                    <>
                        <UserList
                            name={GlobalConstants.PARTICIPANT_USERS}
                            users={eventParticipants}
                        />
                        {eventReserves.length > 0 && (
                            <UserList name={GlobalConstants.RESERVE_USERS} users={eventReserves} />
                        )}
                    </>
                )}
            </Stack>
            <Dialog fullWidth open={!!addDialogOpen} onClose={() => setAddDialogOpen(null)}>
                {/* Dialog content goes here */}
                <Form
                    name={addDialogOpen}
                    action={
                        addDialogOpen === GlobalConstants.PARTICIPANT_USERS
                            ? addEventParticipantAction
                            : addEventReserveAction
                    }
                    customOptions={{
                        [GlobalConstants.USER_ID]: getUserSelectOptions(activeMembers),
                        [GlobalConstants.TICKET_ID]: getTicketsOptions(),
                    }}
                    editable={true}
                    readOnly={false}
                />
            </Dialog>
        </>
    );
};

export default ParticipantDashboard;
