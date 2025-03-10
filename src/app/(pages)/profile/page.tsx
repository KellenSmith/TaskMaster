"use client";

import { Stack, Tab, Tabs } from "@mui/material";
import { useMemo, useState } from "react";
import AccountTab from "./AccountTab";
import EventsTab from "./EventsTab";

const ProfilePage = () => {
    const tabs = useMemo(() => ({ account: "Account", events: "Events" }), []);
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
        </Stack>
    );
};

export default ProfilePage;
