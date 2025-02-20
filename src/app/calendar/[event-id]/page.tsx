"use client";

import { usePathname } from "next/navigation";
import { getEventById, updateEvent } from "../../lib/event-actions";
import { defaultActionState } from "../../ui/Datagrid";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { CircularProgress, Stack } from "@mui/material";
import Form, { FormActionState } from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";

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

    return (
        <Stack>
            {isEventPending ? (
                <CircularProgress />
            ) : (
                <Form
                    name={GlobalConstants.EVENT}
                    buttonLabel="save"
                    action={updateEventById}
                    defaultValues={
                        fetchEventState.result.length > 0 ? fetchEventState.result[0] : undefined
                    }
                />
            )}
        </Stack>
    );
};

export default EventPage;
