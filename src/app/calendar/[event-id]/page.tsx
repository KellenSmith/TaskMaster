"use client";

import { redirect, usePathname } from "next/navigation";
import {
    addEventParticipant,
    deleteEvent,
    getEventById,
    updateEvent,
} from "../../lib/event-actions";
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

    useEffect(() => {
        startTransition(() => {
            fetchEventAction();
        });
        // Only fetch event on first render
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const participate = async () => {
        const participateResult = await addEventParticipant(
            user[GlobalConstants.ID],
            fetchEventState.result[0][GlobalConstants.ID],
            defaultFormActionState,
        );
        startTransition(() => fetchEventAction());
        return participateResult;
    };

    const updateEventById = async (currentActionState: FormActionState, formData: FormData) => {
        return updateEvent(eventId, currentActionState, formData);
    };

    const getHostNickname = () =>
        fetchEventState.result.length > 0
            ? fetchEventState.result[0][GlobalConstants.HOST][GlobalConstants.NICKNAME]
            : "";

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
        <Stack>
            {isEventPending ? (
                <CircularProgress />
            ) : fetchEventState.result.length < 1 ? (
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
                    <Typography color="primary">
                        {`Participants: ${fetchEventState.result[0][GlobalConstants.COUNT][GlobalConstants.PARTICIPANT_USERS]}`}
                    </Typography>
                    <Form
                        name={GlobalConstants.EVENT}
                        buttonLabel="save"
                        action={updateEventById}
                        defaultValues={
                            fetchEventState.result.length > 0
                                ? fetchEventState.result[0]
                                : undefined
                        }
                    />
                    {getEventActionMsg()}
                    <Button onClick={participate}>participate</Button>
                    <Button color="error" onClick={deleteEventAndRedirect}>
                        delete
                    </Button>
                </Stack>
            )}
        </Stack>
    );
};

export default EventPage;
