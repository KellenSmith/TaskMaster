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
} from "@mui/material";
import { Prisma } from "@prisma/client";
import { use } from "react";
import { isUserHost } from "../../lib/definitions";
import { Person } from "@mui/icons-material";

interface ParticipantDashboard {
    eventPromise: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { eventParticipants: true } }; eventReserves: true };
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
}

const ParticipantDashboard = ({
    eventPromise,
    eventParticipantsPromise,
    eventReservesPromise,
}: ParticipantDashboard) => {
    const theme = useTheme();
    const event = use(eventPromise);
    const eventParticipants = use(eventParticipantsPromise);
    const eventReserves = use(eventReservesPromise);

    const UserList = ({
        title,
        items,
    }: {
        title: string;
        items: typeof eventParticipants | typeof eventReserves;
    }) => (
        <List sx={{ minWidth: 200 }}>
            <ListSubheader>{title}</ListSubheader>
            <Divider />
            {items.map((p: (typeof items)[0]) => {
                return (
                    <ListItem key={String(p.user.id)} disableGutters alignItems="center">
                        <ListItemAvatar sx={{ display: "flex", justifyContent: "center" }}>
                            <Person sx={{ color: theme.palette.primary.main }} />
                        </ListItemAvatar>
                        <ListItemText primary={p.user.nickname} />
                        {isUserHost(p.user, event) && (
                            <Chip label="Host" color="primary" size="small" />
                        )}
                    </ListItem>
                );
            })}
        </List>
    );

    return (
        <Stack direction="row" justifyContent="space-around" spacing={2}>
            <UserList title="Participants" items={eventParticipants} />
            {eventReserves.length > 0 && <UserList title="Reserves" items={eventReserves} />}
        </Stack>
    );
};

export default ParticipantDashboard;
