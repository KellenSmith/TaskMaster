"use client";
import { Stack, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AccountTab from "./AccountTab";
import EventsTab from "./EventsTab";
import { isMembershipExpired, clientRedirect } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import { Prisma } from "@prisma/client";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import GlobalConstants from "../../GlobalConstants";
import SkillBadgesTab from "./SkillBadgesTab";
import LanguageTranslations, { implementedTabs } from "./LanguageTranslations";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EventIcon from "@mui/icons-material/Event";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BadgeIcon from "@mui/icons-material/Badge";

interface ProfileDashboardProps {
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: {
                assignee: { select: { id: true; nickname: true } };
                reviewer: { select: { id: true; nickname: true } };
                skill_badges: true;
            };
        }>[]
    >;
    eventsPromise: Promise<
        Prisma.EventGetPayload<{
            include: {
                location: true;
                tickets: { include: { event_participants: true } };
                event_reserves: true;
            };
        }>[]
    >;
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<true>[]>;
}

const ProfileDashboard = ({
    tasksPromise,
    eventsPromise,
    skillBadgesPromise,
}: ProfileDashboardProps) => {
    const { user, language } = useUserContext();
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    const tabs = useMemo(() => {
        const availableTabs = {
            account: implementedTabs.account,
            events: null,
            tasks: null,
            skill_badges: null,
        } as typeof implementedTabs;
        if (!isMembershipExpired(user)) {
            availableTabs.events = implementedTabs.events;
            availableTabs.tasks = implementedTabs.tasks;
            availableTabs.skill_badges = implementedTabs.skill_badges;
        }
        return availableTabs;
    }, [user]);

    const searchParams = useSearchParams();
    const openTab = useMemo(
        () => searchParams.get("tab") || tabs.account,
        [searchParams, tabs.account],
    );
    const setOpenTab = (tab: string) => clientRedirect(router, [GlobalConstants.PROFILE], { tab });
    const router = useRouter();

    const getTabComp = () => {
        switch (openTab) {
            case tabs.events:
                return <EventsTab eventsPromise={eventsPromise} />;
            case tabs.tasks:
                return (
                    <KanBanBoard
                        readOnly={true}
                        tasksPromise={tasksPromise}
                        skillBadgesPromise={skillBadgesPromise}
                    />
                );
            case tabs.skill_badges:
                return <SkillBadgesTab skillBadgesPromise={skillBadgesPromise} />;
            default:
                return <AccountTab />;
        }
    };

    return (
        <Stack>
            <Tabs
                value={openTab || implementedTabs.account}
                onChange={(_, newTab) => setOpenTab(newTab)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                aria-label="profile tabs"
            >
                {Object.keys(tabs).map((tabKey) => {
                    const tabVal = tabs[tabKey];
                    if (!tabVal) return null;
                    const label = LanguageTranslations[tabVal][language] as string;
                    const icon =
                        tabVal === implementedTabs.account ? (
                            <AccountCircleIcon fontSize={isSmall ? "small" : "medium"} />
                        ) : tabVal === implementedTabs.events ? (
                            <EventIcon fontSize={isSmall ? "small" : "medium"} />
                        ) : tabVal === implementedTabs.tasks ? (
                            <AssignmentIcon fontSize={isSmall ? "small" : "medium"} />
                        ) : tabVal === implementedTabs.skill_badges ? (
                            <BadgeIcon fontSize={isSmall ? "small" : "medium"} />
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
            <ErrorBoundarySuspense>{getTabComp()}</ErrorBoundarySuspense>
        </Stack>
    );
};

export default ProfileDashboard;
