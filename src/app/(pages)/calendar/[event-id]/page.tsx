"use client";

import { usePathname } from "next/navigation";
import { getEventById } from "../../../lib/event-actions";
import { defaultActionState as defaultDatagridActionState } from "../../../ui/Datagrid";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { CircularProgress, Stack, Typography, useTheme } from "@mui/material";
import GlobalConstants from "../../../GlobalConstants";
import { useUserContext } from "../../../context/UserContext";
import EventDashboard, { tabs } from "./EventDashboard";

const EventPage = () => {
    const theme = useTheme();
    const { user } = useUserContext();
    const pathname = usePathname();
    const eventId = useMemo(() => pathname.split("/").at(-1), [pathname]);
    const [openTab, setOpenTab] = useState(tabs.event);

    const getEvent = async () => {
        return getEventById(eventId, fetchEventState);
    };

    const [fetchEventState, fetchEventAction, isEventPending] = useActionState(
        getEvent,
        defaultDatagridActionState,
    );

    const getEventResult = () => {
        if (fetchEventState.result.length < 1) return null;
        return fetchEventState.result[0];
    };

    useEffect(() => {
        startTransition(() => {
            fetchEventAction();
        });
        // Only fetch event on first render
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isEventDraft = () => getEventResult()[GlobalConstants.STATUS] === GlobalConstants.DRAFT;

    return (
        !!user && (
            <Stack>
                {isEventPending ? (
                    <CircularProgress />
                ) : !getEventResult() ? (
                    <Typography color={theme.palette.text.secondary}>
                        {"Sorry, this event doesn't exist"}
                    </Typography>
                ) : (
                    <>
                        <Stack spacing={2}>
                            {isEventDraft() && (
                                <Typography variant="h4" color={theme.palette.primary.main}>
                                    {"This is an event draft. It is only visible to the host."}
                                </Typography>
                            )}
                            <EventDashboard
                                event={getEventResult()}
                                fetchEventAction={fetchEventAction}
                                openTab={openTab}
                                setOpenTab={setOpenTab}
                            />
                        </Stack>
                    </>
                )}
            </Stack>
        )
    );
};

export default EventPage;
