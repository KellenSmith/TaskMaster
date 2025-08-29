"use client";

import { Stack, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { use, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isUserHost, clientRedirect, isUserAdmin } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import { isEventCancelled, isEventSoldOut, isUserParticipant } from "./event-utils";
import EventDetails from "./EventDetails";
import { EventStatus, Prisma } from "@prisma/client";
import TicketShop from "./TicketShop";
import EventActions from "./EventActions";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import ParticipantDashboard from "./ParticipantDashboard";
import ReserveDashboard from "./ReserveDashboard";
import TicketDashboard from "./TicketDashboard";
import GlobalConstants from "../../GlobalConstants";
import LocationDashboard from "./LocationDashboard";
import LanguageTranslations, { implementedTabs } from "./LanguageTranslations";

interface EventDashboardProps {
    eventPromise: Promise<
        Prisma.EventGetPayload<{
            include: {
                location: true;
                tickets: { include: { event_participants: true } };
                event_reserves: true;
            };
        }>
    >;
    eventTasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
        }>[]
    >;
    eventTicketsPromise: Promise<
        Prisma.TicketGetPayload<{
            include: { product: true };
        }>[]
    >;
    activeMembersPromise: Promise<
        Prisma.UserGetPayload<{
            select: { id: true; nickname: true; skill_badges: true };
        }>[]
    >;
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<true>[]>;
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
    locationsPromise: Promise<Prisma.LocationGetPayload<true>[]>;
}

const EventDashboard = ({
    eventPromise,
    eventTasksPromise,
    eventTicketsPromise,
    activeMembersPromise,
    skillBadgesPromise,
    eventParticipantsPromise,
    eventReservesPromise,
    locationsPromise,
}: EventDashboardProps) => {
    const theme = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, language } = useUserContext();
    const event = use(eventPromise);

    // Tab is available if it has a label
    const eventTabs = useMemo(() => {
        const availableTabs = {
            details: implementedTabs.details,
            location: implementedTabs.location,
            organize: implementedTabs.organize,
            tickets: implementedTabs.tickets,
            participants: null,
            reserveList: null,
        } as typeof implementedTabs;
        if (isUserHost(user, event) || isUserAdmin(user)) {
            availableTabs.participants = implementedTabs.participants;
        }
        if (isEventSoldOut(event) && !isUserParticipant(user, event))
            availableTabs.reserveList = implementedTabs.reserveList;
        return availableTabs;
    }, [event, user]);

    // Get current tab from search params, default to details
    const openTab = useMemo(
        () => searchParams.get("tab") || eventTabs.details,
        [searchParams, eventTabs],
    );

    const setOpenTab = (tab: string) =>
        clientRedirect(router, [GlobalConstants.EVENT], {
            [GlobalConstants.EVENT_ID]: event.id,
            tab,
        });
    const goToOrganizeTab = () => setOpenTab(eventTabs.organize);

    const getOpenTabComp = () => {
        switch (openTab) {
            case eventTabs.location:
                return (
                    <LocationDashboard
                        eventPromise={eventPromise}
                        locationsPromise={locationsPromise}
                    />
                );
            case eventTabs.organize:
                return (
                    <ErrorBoundarySuspense>
                        <KanBanBoard
                            readOnly={!(isUserHost(user, event) || isUserAdmin(user))}
                            eventPromise={eventPromise}
                            tasksPromise={eventTasksPromise}
                            activeMembersPromise={activeMembersPromise}
                            skillBadgesPromise={skillBadgesPromise}
                        />
                    </ErrorBoundarySuspense>
                );
            case eventTabs.tickets:
                if (!isUserHost(user, event) && isUserParticipant(user, event))
                    return (
                        <ErrorBoundarySuspense>
                            <TicketDashboard
                                eventPromise={eventPromise}
                                ticketsPromise={eventTicketsPromise}
                            />
                        </ErrorBoundarySuspense>
                    );
                return (
                    <ErrorBoundarySuspense>
                        <TicketShop
                            eventPromise={eventPromise}
                            eventTicketsPromise={eventTicketsPromise}
                            eventTasksPromise={eventTasksPromise}
                            goToOrganizeTab={goToOrganizeTab}
                        />
                    </ErrorBoundarySuspense>
                );

            case eventTabs.participants:
                return (
                    <ErrorBoundarySuspense>
                        <ParticipantDashboard
                            eventPromise={eventPromise}
                            eventParticipantsPromise={eventParticipantsPromise}
                            eventReservesPromise={eventReservesPromise}
                            eventTicketsPromise={eventTicketsPromise}
                            activeMembersPromise={activeMembersPromise}
                        />
                    </ErrorBoundarySuspense>
                );
            case eventTabs.reserveList:
                return <ReserveDashboard eventPromise={eventPromise} />;
            default:
                return <EventDetails eventPromise={eventPromise} />;
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
                    {`${event.title} ${isEventCancelled(event) ? `"${LanguageTranslations.cancelled[language].toUpperCase()}"` : isEventSoldOut(event) ? "(SOLD OUT)" : ""}`}
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
                        ([key, label]) =>
                            label && (
                                <Tab
                                    key={key}
                                    value={label}
                                    label={LanguageTranslations[label][language]}
                                />
                            ),
                    )}
                </Tabs>
                <Stack width={50}>
                    <ErrorBoundarySuspense>
                        <EventActions
                            eventPromise={eventPromise}
                            locationsPromise={locationsPromise}
                        />
                    </ErrorBoundarySuspense>
                </Stack>
            </Stack>
            <ErrorBoundarySuspense>{getOpenTabComp()}</ErrorBoundarySuspense>
        </Stack>
    );
};
export default EventDashboard;
