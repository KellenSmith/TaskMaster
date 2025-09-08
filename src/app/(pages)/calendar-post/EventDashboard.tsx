"use client";

import { Stack, Tab, Tabs, Typography, useTheme, useMediaQuery } from "@mui/material";
import { use, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isUserHost, clientRedirect, isUserAdmin } from "../../lib/utils";
import { useUserContext } from "../../context/UserContext";
import { isEventCancelled, isEventSoldOut, isUserParticipant } from "./event-utils";
import EventDetails from "./EventDetails";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PeopleIcon from "@mui/icons-material/People";
import BookmarkIcon from "@mui/icons-material/Bookmark";
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
    eventTagsPromise: Promise<string[]>;
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
    eventTagsPromise,
}: EventDashboardProps) => {
    const theme = useTheme();
    const router = useRouter();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
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

    if (!user) return null;

    const setOpenTab = (tab: string) =>
        clientRedirect(router, [GlobalConstants.CALENDAR_POST], {
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
                    <KanBanBoard
                        readOnly={!(isUserHost(user, event) || isUserAdmin(user))}
                        eventPromise={eventPromise}
                        tasksPromise={eventTasksPromise}
                        activeMembersPromise={activeMembersPromise}
                        skillBadgesPromise={skillBadgesPromise}
                    />
                );
            case eventTabs.tickets:
                if (!isUserHost(user, event) && isUserParticipant(user, event))
                    return (
                        <TicketDashboard
                            eventPromise={eventPromise}
                            ticketsPromise={eventTicketsPromise}
                        />
                    );
                return (
                    <TicketShop
                        eventPromise={eventPromise}
                        eventTicketsPromise={eventTicketsPromise}
                        eventTasksPromise={eventTasksPromise}
                        goToOrganizeTab={goToOrganizeTab}
                    />
                );

            case eventTabs.participants:
                return (
                    <ParticipantDashboard
                        eventPromise={eventPromise}
                        eventParticipantsPromise={eventParticipantsPromise}
                        eventReservesPromise={eventReservesPromise}
                        eventTicketsPromise={eventTicketsPromise}
                        activeMembersPromise={activeMembersPromise}
                    />
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
                    <Typography
                        variant="h4"
                        sx={{
                            border: `1px solid ${theme.palette.warning.light}`,
                            borderRadius: 2,
                            textAlign: "center",
                            color: theme.palette.warning.light,
                        }}
                    >
                        {LanguageTranslations.eventDraftNote[language]}
                    </Typography>
                )}
                {event.status === EventStatus.pending_approval && (
                    <Typography
                        variant="h4"
                        sx={{
                            border: `1px solid ${theme.palette.info.light}`,
                            borderRadius: 2,
                            textAlign: "center",
                            color: theme.palette.info.light,
                        }}
                    >
                        {LanguageTranslations.pendingApprovalNote[language]}
                    </Typography>
                )}
                <Typography
                    variant="h4"
                    sx={{
                        color: isEventCancelled(event)
                            ? theme.palette.error.main
                            : theme.palette.primary.main,
                        textDecoration: isEventCancelled(event) ? "line-through" : "none",
                        textAlign: isSmall ? "center" : "left",
                    }}
                >
                    {`${event.title} ${isEventCancelled(event) ? `"${LanguageTranslations.cancelled[language].toUpperCase()}"` : isEventSoldOut(event) ? "(SOLD OUT)" : ""}`}
                </Typography>
            </Stack>

            <Stack
                direction="row"
                flexWrap="nowrap"
                padding={isSmall ? 0 : "0 24px 0 24px"}
                justifyContent="space-between"
                spacing={isSmall ? 0 : 2}
                alignItems="center"
            >
                <Tabs
                    value={openTab || implementedTabs.details}
                    onChange={(_, newTab) => setOpenTab(newTab)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    aria-label="event tabs"
                    sx={{ flex: 1, minWidth: 0 }}
                >
                    {Object.keys(eventTabs).map((tabKey) => {
                        // @ts-ignore -- dynamic indexing matches project pattern
                        const tabVal = eventTabs[tabKey];
                        if (!tabVal) return null;
                        const label = LanguageTranslations[tabVal][language] as string;
                        const icon =
                            tabVal === implementedTabs.details ? (
                                <EventIcon fontSize={isSmall ? "small" : "medium"} />
                            ) : tabVal === implementedTabs.location ? (
                                <LocationOnIcon fontSize={isSmall ? "small" : "medium"} />
                            ) : tabVal === implementedTabs.organize ? (
                                <VolunteerActivismIcon fontSize={isSmall ? "small" : "medium"} />
                            ) : tabVal === implementedTabs.tickets ? (
                                <ConfirmationNumberIcon fontSize={isSmall ? "small" : "medium"} />
                            ) : tabVal === implementedTabs.participants ? (
                                <PeopleIcon fontSize={isSmall ? "small" : "medium"} />
                            ) : tabVal === implementedTabs.reserveList ? (
                                <BookmarkIcon fontSize={isSmall ? "small" : "medium"} />
                            ) : undefined;

                        return (
                            <Tab
                                key={tabKey}
                                value={tabVal}
                                label={isSmall ? undefined : label}
                                icon={icon}
                                iconPosition="start"
                                wrapped
                                sx={{
                                    minWidth: isSmall ? 64 : 120,
                                    px: isSmall ? 0.5 : 1,
                                    fontSize: isSmall ? "0.75rem" : "0.875rem",
                                    textTransform: "none",
                                }}
                            />
                        );
                    })}
                </Tabs>

                <Stack sx={{ flexShrink: 0 }}>
                    <ErrorBoundarySuspense>
                        <EventActions
                            eventPromise={eventPromise}
                            locationsPromise={locationsPromise}
                            eventTagsPromise={eventTagsPromise}
                        />
                    </ErrorBoundarySuspense>
                </Stack>
            </Stack>
            <ErrorBoundarySuspense>{getOpenTabComp()}</ErrorBoundarySuspense>
        </Stack>
    );
};
export default EventDashboard;
