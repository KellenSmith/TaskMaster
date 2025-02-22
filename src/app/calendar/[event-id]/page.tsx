"use client";

import { redirect, usePathname } from "next/navigation";
import { deleteEvent, getEventById, updateEvent } from "../../lib/event-actions";
import { defaultActionState as defaultDatagridActionState } from "../../ui/Datagrid";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { Button, CircularProgress, Stack, TextField, Typography, useTheme } from "@mui/material";
import Form, {
    FormActionState,
    defaultActionState as defaultFormActionState,
} from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { useUserContext } from "../../context/UserContext";
import { isUserAdmin, isUserHost } from "../../lib/definitions";
import ParticipationSection from "./ParticipationSection";

const EventPage = () => {
    const theme = useTheme();
    const { user } = useUserContext();
    const pathname = usePathname();
    const eventId = useMemo(() => pathname.split("/").at(-1), [pathname]);
    const [eventActionState, setEventActionState] = useState(defaultFormActionState);

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

    const updateEventById = async (currentActionState: FormActionState, formData: FormData) => {
        return updateEvent(eventId, currentActionState, formData);
    };

    const getHostNickname = () => {
        const event = getEventResult();
        event ? event[GlobalConstants.HOST][GlobalConstants.NICKNAME] : "";
    };

    const deleteEventAndRedirect = async () => {
        const deleteResult = await deleteEvent(eventId, defaultFormActionState);
        if (deleteResult.status !== 200) return setEventActionState(deleteResult);
        // Redirect to calendar when event is deleted
        redirect(`/${GlobalConstants.CALENDAR}`);
    };

    const getEventActionMsg = () => {
        if (eventActionState.status !== 200)
            return <Typography color="error">{eventActionState.errorMsg}</Typography>;
        if (eventActionState.result)
            return <Typography color="success">{eventActionState.result}</Typography>;
    };

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
                    <Stack>
                        <TextField
                            disabled
                            label={FieldLabels[GlobalConstants.HOST]}
                            name={GlobalConstants.HOST}
                            defaultValue={getHostNickname()}
                        />
                        <ParticipationSection
                            event={getEventResult()}
                            fetchEventAction={fetchEventAction}
                        />

                        <Form
                            name={GlobalConstants.EVENT}
                            buttonLabel="save"
                            action={updateEventById}
                            defaultValues={
                                fetchEventState.result.length > 0 ? getEventResult() : undefined
                            }
                            readOnly={!(isUserAdmin(user) || isUserHost(user, getEventResult()))}
                        />
                        {getEventActionMsg()}
                        {isUserAdmin(user) && (
                            <Button color="error" onClick={deleteEventAndRedirect}>
                                delete
                            </Button>
                        )}
                    </Stack>
                )}
            </Stack>
        )
    );
};

export default EventPage;
