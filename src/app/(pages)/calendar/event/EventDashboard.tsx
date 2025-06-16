"use client";

import { Stack, Tab, Tabs, Typography, useTheme } from "@mui/material";
import GlobalConstants from "../../../GlobalConstants";
import { Suspense, useState } from "react";
import { isUserHost } from "../../../lib/definitions";
import { useUserContext } from "../../../context/UserContext";
import TaskDashboard from "./(tasks)/TaskDashboard";
import {
    defaultActionState as defaultFormActionState,
    getFormActionMsg,
} from "../../../ui/form/Form";
import { isEventCancelled, isEventSoldOut } from "./event-utils";
import EventActions from "./EventActions";
import EventDetails from "./EventDetails";

export const tabs = { details: "Details", tasks: "Participate" };

const EventDashboard = ({ event, fetchEventAction }) => {
    const theme = useTheme();
    const { user } = useUserContext();
    const [eventActionState, setEventActionState] = useState(defaultFormActionState);
    const [openTab, setOpenTab] = useState(tabs.details);

    return (
        <Suspense>
            <Typography
                variant="h4"
                sx={{
                    color: isEventCancelled(event)
                        ? theme.palette.error.main
                        : theme.palette.primary.main,
                    textDecoration: isEventCancelled(event) ? "line-through" : "none",
                }}
            >
                {`${event[GlobalConstants.TITLE]} ${isEventCancelled(event) ? "(CANCELLED)" : isEventSoldOut(event) ? "(SOLD OUT)" : ""}`}
            </Typography>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Tabs value={openTab} onChange={(_, newTab) => setOpenTab(newTab)}>
                    {Object.keys(tabs).map((tab) => (
                        <Tab key={tabs[tab]} value={tabs[tab]} label={tabs[tab]} />
                    ))}
                </Tabs>

                <EventActions
                    event={event}
                    fetchEventAction={fetchEventAction}
                    setEventActionState={setEventActionState}
                    openTab={openTab}
                    setOpenTab={setOpenTab}
                />
            </Stack>
            {getFormActionMsg(eventActionState)}

            {openTab === tabs.details && (
                <EventDetails
                    event={event}
                    fetchEventAction={fetchEventAction}
                    setEventActionState={setEventActionState}
                />
            )}
            {openTab === tabs.tasks && (
                <TaskDashboard
                    readOnly={!isUserHost(user, event)}
                    event={event}
                    fetchEventAction={fetchEventAction}
                />
            )}
        </Suspense>
    );
};
export default EventDashboard;
