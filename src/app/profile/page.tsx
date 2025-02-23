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
                <Tab key={tabs.account} value={tabs.account} label={tabs.account} />
                <Tab key={tabs.events} value={tabs.events} label={tabs.events} />
            </Tabs>
            {openTab === tabs.account && <AccountTab />}
            {openTab === tabs.events && <EventsTab />}
        </Stack>
    );
};

export default ProfilePage;
