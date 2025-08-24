"use client";

import { Stack, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { use, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { isUserHost } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import { isEventCancelled, isEventSoldOut, isUserParticipant, isUserReserve } from "./event-utils";
import EventDetails from "./EventDetails";
import { EventStatus, Prisma } from "@prisma/client";
import TicketShop from "./TicketShop";
import EventActions from "./EventActions";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import ParticipantDashboard from "./ParticipantDashboard";
import ReserveDashboard from "./ReserveDashboard";
import TicketDashboard from "./TicketDashboard";
import { navigateToRoute } from "../../ui/utils";

interface EventDashboardProps {
    eventPromise: Promise<
        Prisma.EventGetPayload<{ include: { host: { select: { id: true; nickname: true } } } }>
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
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useUserContext();
    const event = use(eventPromise);
    const eventParticipants = use(eventParticipantsPromise);

    // Tab is available if it has a label
    const eventTabs = useMemo(() => {
        const tabs = {
            details: "Details",
            organize: "Organize",
            tickets: "Tickets",
            participants: null,
            reserveList: null,
        };
        if (isUserHost(user, event)) {
            tabs.participants = "Participants";
        }
        if (isEventSoldOut(event, eventParticipants) && !isUserParticipant(user, eventParticipants))
            tabs.reserveList = "Reserve List";
        return tabs;
    }, []);

    // Get current tab from search params, default to details
    const openTab = useMemo(
        () => searchParams.get("tab") || eventTabs.details,
        [searchParams, eventTabs],
    );

    const setOpenTab = (tab: string) => {
        navigateToRoute(router, [pathname], { eventId: event.id, tab });
    };

    const goToOrganizeTab = () => setOpenTab(eventTabs.organize);

    const getOpenTabComp = () => {
        switch (openTab) {
            case eventTabs.organize:
                return (
                    <KanBanBoard
                        readOnly={!isUserHost(user, event)}
                        event={event}
                        tasksPromise={eventTasksPromise}
                        activeMembersPromise={activeMembersPromise}
                    />
                );
            case eventTabs.tickets:
                if (!isUserHost(user, event) && isUserParticipant(user, eventParticipants))
                    return (
                        <TicketDashboard
                            eventPromise={eventPromise}
                            eventParticipantsPromise={eventParticipantsPromise}
                            ticketsPromise={eventTicketsPromise}
                        />
                    );
                return (
                    <TicketShop
                        event={event}
                        eventTicketsPromise={eventTicketsPromise}
                        eventTasksPromise={eventTasksPromise}
                        goToOrganizeTab={goToOrganizeTab}
                    />
                );

            case eventTabs.participants:
                return <ParticipantDashboard />;
            case eventTabs.reserveList:
                return (
                    <ReserveDashboard
                        eventPromise={eventPromise}
                        eventReservesPromise={eventReservesPromise}
                    />
                );
            default:
                return <EventDetails event={event} />;
        }
    };

    return (
        <Stack>
            <Stack padding="0 24px 0 24px" spacing={2}>
                {event.status === EventStatus.draft && (
                    <Typography variant="h4" color={theme.palette.warning.light}>
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
                    {Object.entries(eventTabs).map(
                        ([key, label]) => label && <Tab key={key} value={label} label={label} />,
                    )}
                </Tabs>
                {isUserHost(user, event) && (
                    <ErrorBoundarySuspense errorMessage="Failed to load event reserves">
                        <EventActions
                            event={event}
                            eventParticipantsPromise={eventParticipantsPromise}
                            eventReservesPromise={eventReservesPromise}
                        />
                    </ErrorBoundarySuspense>
                )}
            </Stack>
            <ErrorBoundarySuspense errorMessage="Failed to load event details">
                {getOpenTabComp()}
            </ErrorBoundarySuspense>
        </Stack>
    );
};
export default EventDashboard;
