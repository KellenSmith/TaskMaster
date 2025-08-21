"use client";
import { Stack, Tab, Tabs } from "@mui/material";
import { useMemo, useState } from "react";
import AccountTab from "./AccountTab";
import EventsTab from "./EventsTab";
import TasksTab from "./TasksTab";
import { isMembershipExpired } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";

const ProfileDashboard = async () => {
    const { user } = useUserContext();
    const tabs = useMemo(
        () => ({
            account: "Account",
            ...(!isMembershipExpired(user) && { events: "Events", tasks: "Tasks" }),
        }),
        [user],
    );
    const [openTab, setOpenTab] = useState<string>(tabs.account);

    return (
        <Stack>
            <Tabs value={openTab} onChange={(_, newTab) => setOpenTab(newTab)}>
                {Object.keys(tabs).map((tab) => (
                    <Tab key={tabs[tab]} value={tabs[tab]} label={tabs[tab]} />
                ))}
            </Tabs>
            {openTab === tabs.account && <AccountTab />}
            {openTab === tabs.events && <EventsTab />}
            {openTab === tabs.tasks && <TasksTab />}
        </Stack>
    );
};

export default ProfileDashboard;
