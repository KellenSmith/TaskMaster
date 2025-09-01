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
    useMediaQuery,
    Button,
} from "@mui/material";
import { Prisma } from "@prisma/client";
import { use, useState, useTransition } from "react";
import { isUserHost } from "../../lib/definitions";
import { Add, Delete, Person } from "@mui/icons-material";
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
import { useUserContext } from "../../context/UserContext";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import LanguageTranslations from "./LanguageTranslations";

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
    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const event = use(eventPromise);
    const eventParticipants = use(eventParticipantsPromise);
    const eventReserves = use(eventReservesPromise);
    const tickets = use(eventTicketsPromise);
    const activeMembers = use(activeMembersPromise);
    const [addDialogOpen, setAddDialogOpen] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

    const addEventParticipantAction = async (
        parsedFieldValues: z.infer<typeof AddEventParticipantSchema>,
    ) => {
        const participantIds = eventParticipants.map((p) => p.user.id);
        if (participantIds.includes(parsedFieldValues.user_id))
            throw new Error(LanguageTranslations.alreadyRegistered[language]);
        if (eventParticipants.length >= event.max_participants)
            throw new Error(LanguageTranslations.eventIsSoldOut[language]);
        try {
            await addEventParticipant(parsedFieldValues.user_id, parsedFieldValues.ticket_id);
            setAddDialogOpen(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const addEventReserveAction = async (
        parsedFieldValues: z.infer<typeof AddEventReserveSchema>,
    ) => {
        const reserveIds = eventReserves.map((r) => r.user.id);
        if (reserveIds.includes(parsedFieldValues.user_id))
            throw new Error(LanguageTranslations.alreadyRegistered[language]);
        try {
            await addEventReserve(parsedFieldValues.user_id, event.id);
            setAddDialogOpen(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const deleteEventParticipantAction = async (userId: string) => {
        startTransition(async () => {
            try {
                await deleteEventParticipant(event.id, userId);
                addNotification(GlobalLanguageTranslations.successfulDelete[language], "success");
            } catch {
                addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
            }
        });
    };

    const deleteEventReserveAction = async (userId: string) => {
        startTransition(async () => {
            try {
                await deleteEventReserve(userId, event.id);
                addNotification(GlobalLanguageTranslations.successfulDelete[language], "success");
            } catch {
                addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
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
                    {FieldLabels[name][language] as string}
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
                                    <Chip
                                        label={LanguageTranslations.host[language]}
                                        color="primary"
                                        size="small"
                                    />
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
        <Stack>
            <Stack direction={isSmDown ? "column" : "row"} justifyContent="center" spacing={2}>
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
            <Dialog
                fullWidth
                fullScreen={isSmDown}
                open={!!addDialogOpen}
                onClose={() => setAddDialogOpen(null)}
            >
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
                <Button onClick={() => setAddDialogOpen(null)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </Stack>
    );
};

export default ParticipantDashboard;
