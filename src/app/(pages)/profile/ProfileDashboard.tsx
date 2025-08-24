"use client";
import { Stack, Tab, Tabs } from "@mui/material";
import { useMemo, useState } from "react";
import AccountTab from "./AccountTab";
import EventsTab from "./EventsTab";
import { isMembershipExpired } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import { Prisma } from "@prisma/client";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

interface ProfileDashboardProps {
    tasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: {
                assignee: { select: { id: true; nickname: true } };
                reviewer: { select: { id: true; nickname: true } };
            };
        }>[]
    >;
    eventsPromise: Promise<
        Prisma.EventGetPayload<{
            include: {
                host: { select: { id: true; nickname: true } };
                eventParticipants: { include: { user: { select: { id: true; nickname: true } } } };
                eventReserves: { include: { user: { select: { id: true; nickname: true } } } };
            };
        }>[]
    >;
}

const ProfileDashboard = ({ tasksPromise, eventsPromise }: ProfileDashboardProps) => {
    const { user } = useUserContext();
    const tabs = useMemo(
        () => ({
            account: "Account",
            ...(!isMembershipExpired(user) && { events: "Events", tasks: "Tasks" }),
        }),
        [user],
    );
    const [openTab, setOpenTab] = useState<string>(tabs.account);

    const getTabComp = () => {
        switch (openTab) {
            case tabs.events:
                return <EventsTab eventsPromise={eventsPromise} />;
            case tabs.tasks:
                return <KanBanBoard readOnly={true} tasksPromise={tasksPromise} />;
            default:
                return <AccountTab />;
        }
    };

    return (
        <Stack>
            <Tabs value={openTab} onChange={(_, newTab) => setOpenTab(newTab)}>
                {Object.keys(tabs).map((tab) => (
                    <Tab key={tabs[tab]} value={tabs[tab]} label={tabs[tab]} />
                ))}
            </Tabs>
            <ErrorBoundarySuspense>{getTabComp()}</ErrorBoundarySuspense>
        </Stack>
    );
};

export default ProfileDashboard;
