"use client";

import { usePathname } from "next/navigation";
import { getEventById, updateEvent } from "../../lib/event-actions";
import { defaultActionState } from "../../ui/Datagrid";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { CircularProgress, Stack, TextField } from "@mui/material";
import Form, { FormActionState } from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";
import { FieldLabels } from "../../ui/form/FieldCfg";

const EventPage = () => {
    const pathname = usePathname();
    const eventId = useMemo(() => pathname.split("/").at(-1), [pathname]);

    const getEvent = async () => {
        return getEventById(eventId, fetchEventState);
    };

    const [fetchEventState, fetchEventAction, isEventPending] = useActionState(
        getEvent,
        defaultActionState,
    );

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

    const getHostNickname = () =>
        fetchEventState.result.length > 0
            ? fetchEventState.result[0][GlobalConstants.HOST][GlobalConstants.NICKNAME]
            : "";

    return (
        <Stack>
            {isEventPending ? (
                <CircularProgress />
            ) : (
                <Stack>
                    <TextField
                        disabled
                        label={FieldLabels[GlobalConstants.HOST]}
                        name={GlobalConstants.HOST}
                        defaultValue={getHostNickname()}
                    />
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
                </Stack>
            )}
        </Stack>
    );
};

export default EventPage;
