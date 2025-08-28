"use client";
import { Stack, Tab, Tabs } from "@mui/material";
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

interface ProfileDashboardProps {
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: {
                assignee: { select: { id: true; nickname: true } };
                reviewer: { select: { id: true; nickname: true } };
                skillBadges: true;
            };
        }>[]
    >;
    eventsPromise: Promise<
        Prisma.EventGetPayload<{
            include: {
                location: true;
                tickets: { include: { eventParticipants: true } };
                eventReserves: true;
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
    const { user } = useUserContext();
    const tabs = useMemo(() => {
        const availableTabs = {
            account: "Account",
            events: null,
            tasks: null,
            skill_badges: null,
        };
        if (!isMembershipExpired(user)) {
            availableTabs.events = "Events";
            availableTabs.tasks = "Tasks";
            availableTabs.skill_badges = "Skill Badges";
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
            <Tabs value={openTab} onChange={(_, newTab) => setOpenTab(newTab)}>
                {Object.keys(tabs).map((tabKey) =>
                    tabs[tabKey] ? (
                        <Tab key={tabKey} value={tabs[tabKey]} label={tabs[tabKey]} />
                    ) : null,
                )}
            </Tabs>
            <ErrorBoundarySuspense>{getTabComp()}</ErrorBoundarySuspense>
        </Stack>
    );
};

export default ProfileDashboard;
