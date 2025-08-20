"use client";

import { CircularProgress, Stack, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { Suspense, useState, use } from "react";
import { isUserHost } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import TaskDashboard from "../calendar/event/(tasks)/TaskDashboard";
import { isEventCancelled, isEventSoldOut } from "./event-utils";
import EventActions from "./EventActions";
import EventDetails from "./EventDetails";
import { EventStatus, Prisma } from "@prisma/client";
import { ErrorBoundary } from "react-error-boundary";
import TicketShop from "../calendar/event/(tasks)/TicketShop";

interface EventDashboardProps {
    eventPromise: Promise<
        Prisma.EventGetPayload<{ include: { host: { select: { id: true; nickname: true } } } }>
    >;
    eventParticipantsPromise: Promise<
        Prisma.ParticipantInEventGetPayload<{
            include: { User: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventReservesPromise: Promise<
        Prisma.ReserveInEventGetPayload<{
            include: { User: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventTasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { Assignee: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventTicketsPromise: Promise<
        Prisma.TicketGetPayload<{
            include: { Product: true };
        }>[]
    >;
}

const EventDashboard = ({
    eventPromise,
    eventParticipantsPromise,
    eventReservesPromise,
    eventTasksPromise,
    eventTicketsPromise,
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
                {event.status === EventStatus.draft && (
                    <Typography variant="h4" color={theme.palette.primary.main}>
                        {"This is an event draft. It is only visible to the host."}
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

                <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Tabs value={openTab} onChange={(_, newTab) => setOpenTab(newTab)}>
                        {Object.keys(EventTabs).map((tab) => (
                            <Tab
                                key={EventTabs[tab]}
                                value={EventTabs[tab]}
                                label={EventTabs[tab]}
                            />
                        ))}
                    </Tabs>
                    <ErrorBoundary
                        fallback={
                            <Typography color="primary">Failed to load event reserves</Typography>
                        }
                    >
                        <Suspense
                            fallback={
                                <Typography color="primary">Loading event reserves...</Typography>
                            }
                        >
                            <EventActions
                                event={event}
                                openTab={openTab}
                                setOpenTab={setOpenTab}
                                eventParticipants={eventParticipants}
                                eventReservesPromise={eventReservesPromise}
                            />
                        </Suspense>
                    </ErrorBoundary>
                </Stack>

                {openTab === EventTabs.details && (
                    <ErrorBoundary
                        fallback={
                            <Typography color="primary">Failed to load event reserves</Typography>
                        }
                    >
                        <Suspense
                            fallback={
                                <Typography color="primary">Loading event reserves...</Typography>
                            }
                        >
                            <EventDetails
                                event={event}
                                eventParticipants={eventParticipants}
                                eventReservesPromise={eventReservesPromise}
                            />
                        </Suspense>
                    </ErrorBoundary>
                )}
                {openTab === EventTabs.organize && (
                    <ErrorBoundary
                        fallback={<Typography color="primary">Failed to load tasks</Typography>}
                    >
                        <Suspense
                            fallback={<Typography color="primary">Loading tasks...</Typography>}
                        >
                            <TaskDashboard
                                readOnly={!isUserHost(user, event)}
                                event={event}
                                eventTaskPromise={eventTasksPromise}
                            />
                        </Suspense>
                    </ErrorBoundary>
                )}
                {openTab === EventTabs.tickets && (
                    <ErrorBoundary
                        fallback={
                            <Typography color="primary">
                                "Sorry, we couldn't fetch event tickets"
                            </Typography>
                        }
                    >
                        <Suspense fallback={<CircularProgress />}>
                            <TicketShop
                                event={event}
                                eventTicketsPromise={eventTicketsPromise}
                                goToOrganizeTab={goToOrganizeTab}
                                eventParticipants={eventParticipants}
                            />
                        </Suspense>
                    </ErrorBoundary>
                )}
            </Stack>
        )
    );
};
export default EventDashboard;
