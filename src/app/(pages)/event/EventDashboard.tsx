"use client";

import { CircularProgress, Stack, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { Suspense, useState, use } from "react";
import { isUserHost } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import { isEventCancelled, isEventSoldOut } from "./event-utils";
import EventDetails from "./EventDetails";
import { EventStatus, Prisma } from "@prisma/client";
import { ErrorBoundary } from "react-error-boundary";
import TicketShop from "./(tasks)/TicketShop";
import EventActions from "./EventActions";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

interface EventDashboardProps {
    eventPromise: Promise<
        Prisma.EventGetPayload<{ include: { host: { select: { id: true; nickname: true } } } }>
    >;
    eventParticipantsPromise: Promise<
        Prisma.ParticipantInEventGetPayload<{
            include: { user: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventReservesPromise: Promise<
        Prisma.ReserveInEventGetPayload<{
            include: { user: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventTasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventTicketsPromise: Promise<
        Prisma.TicketGetPayload<{
            include: { product: true };
        }>[]
    >;
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true };
        }>[]
    >;
}

const EventDashboard = ({
    eventPromise,
    eventParticipantsPromise,
    eventReservesPromise,
    eventTasksPromise,
    eventTicketsPromise,
    activeMembersPromise,
}: EventDashboardProps) => {
    const theme = useTheme();
    const { user } = useUserContext();

    enum EventTabs {
        details = "Details",
        organize = "Organize",
        tickets = "Tickets",
    }

    const [openTab, setOpenTab] = useState(EventTabs.details);
    const event = use(eventPromise);
    const eventParticipants = use(eventParticipantsPromise);

    const goToOrganizeTab = () => setOpenTab(EventTabs.organize);

    return (
        user && (
            <Stack>
                <Stack padding="0 24px 0 24px" spacing={2}>
                    {event.status === EventStatus.draft && (
                        <Typography variant="h4" color="warning">
                            This is an event draft and is only visible to the host
                        </Typography>
                    )}
                    <Typography
                        variant="h4"
                        sx={{
                            color: isEventCancelled(event)
                                ? theme.palette.error.main
                                : theme.palette.primary.main,
                            textDecoration: isEventCancelled(event) ? "line-through" : "none",
                        }}
                    >
                        {`${event.title} ${isEventCancelled(event) ? "(CANCELLED)" : isEventSoldOut(event, eventParticipants) ? "(SOLD OUT)" : ""}`}
                    </Typography>
                </Stack>

                <Stack
                    direction="row"
                    padding="0 24px 0 24px "
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Tabs value={openTab} onChange={(_, newTab) => setOpenTab(newTab)}>
                        {Object.keys(EventTabs).map((tab) => (
                            <Tab
                                key={EventTabs[tab]}
                                value={EventTabs[tab]}
                                label={EventTabs[tab]}
                            />
                        ))}
                    </Tabs>
                    {isUserHost(user, event) && (
                        <ErrorBoundarySuspense errorMessage="Failed to load event reserves">
                            <EventActions
                                event={event}
                                eventParticipants={eventParticipants}
                                eventReservesPromise={eventReservesPromise}
                            />
                        </ErrorBoundarySuspense>
                    )}
                </Stack>

                {openTab === EventTabs.details && (
                    <ErrorBoundarySuspense errorMessage="Failed to load event reserves">
                        <EventDetails
                            event={event}
                            eventParticipants={eventParticipants}
                            eventReservesPromise={eventReservesPromise}
                        />
                    </ErrorBoundarySuspense>
                )}
                {openTab === EventTabs.organize && (
                    <ErrorBoundarySuspense errorMessage="Failed to load tasks">
                        <KanBanBoard
                            readOnly={!isUserHost(user, event)}
                            event={event}
                            tasksPromise={eventTasksPromise}
                            activeMembersPromise={activeMembersPromise}
                        />
                    </ErrorBoundarySuspense>
                )}
                {openTab === EventTabs.tickets && (
                    <ErrorBoundarySuspense errorMessage="Failed to load event tickets">
                        <TicketShop
                            event={event}
                            eventTicketsPromise={eventTicketsPromise}
                            eventTasksPromise={eventTasksPromise}
                            goToOrganizeTab={goToOrganizeTab}
                            eventParticipants={eventParticipants}
                        />
                    </ErrorBoundarySuspense>
                )}
            </Stack>
        )
    );
};
export default EventDashboard;
