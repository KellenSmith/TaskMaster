"use client";

import { usePathname } from "next/navigation";
import { getEventById } from "../../lib/event-actions";
import { defaultActionState as defaultDatagridActionState } from "../../ui/Datagrid";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { CircularProgress, Stack, TextField, Typography, useTheme } from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { useUserContext } from "../../context/UserContext";
import { isUserParticipant } from "../../lib/definitions";
import ParticipationSection from "./ParticipationSection";
import SwishPaymentHandler from "../../ui/swish/SwishPaymentHandler";
import EventDashboard from "./EventDashboard";

const EventPage = () => {
    const theme = useTheme();
    const { user } = useUserContext();
    const pathname = usePathname();
    const eventId = useMemo(() => pathname.split("/").at(-1), [pathname]);
    const [paymentHandlerOpen, setPaymentHandlerOpen] = useState(false);

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

    const hasBoughtTicket = async (): Promise<boolean> => {
        startTransition(() => {
            fetchEventAction();
        });
        return isUserParticipant(user, getEventResult());
    };

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
                                    {"This is an event draft. It is only visible to you."}
                                </Typography>
                            )}
                            <TextField
                                disabled
                                label={FieldLabels[GlobalConstants.HOST]}
                                name={GlobalConstants.HOST}
                                value={
                                    getEventResult()[GlobalConstants.HOST][GlobalConstants.NICKNAME]
                                }
                            />
                            {!isEventDraft() && (
                                <ParticipationSection
                                    event={getEventResult()}
                                    fetchEventAction={fetchEventAction}
                                    setPaymentHandlerOpen={setPaymentHandlerOpen}
                                />
                            )}
                            <EventDashboard
                                event={getEventResult()}
                                fetchEventAction={fetchEventAction}
                            />
                        </Stack>
                        <SwishPaymentHandler
                            title="Buy ticket"
                            open={paymentHandlerOpen}
                            setOpen={setPaymentHandlerOpen}
                            hasPaid={hasBoughtTicket}
                            paymentAmount={
                                getEventResult()
                                    ? getEventResult()[GlobalConstants.FULL_TICKET_PRICE]
                                    : 0
                            }
                            callbackEndpoint="buy-event-ticket"
                            callbackParams={{
                                [GlobalConstants.USER_ID]: user[GlobalConstants.ID],
                                [GlobalConstants.EVENT_ID]: getEventResult()
                                    ? getEventResult()[GlobalConstants.ID]
                                    : "",
                            }}
                        />
                    </>
                )}
            </Stack>
        )
    );
};

export default EventPage;
