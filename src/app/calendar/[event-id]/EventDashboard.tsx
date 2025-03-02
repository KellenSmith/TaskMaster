"use client";

import { Button, Stack, Tab, Tabs } from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { useMemo, useState } from "react";
import { isUserAdmin, isUserHost } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import TaskDashboard from "./(tasks)/TaskDashboard";
import Form, { defaultActionState, FormActionState, getFormActionMsg } from "../../ui/form/Form";
import { redirect } from "next/navigation";
import { deleteEvent, updateEvent } from "../../lib/event-actions";
import { Prisma } from "@prisma/client";

const EventDashboard = ({ event }) => {
    const { user } = useUserContext();
    const tabs = useMemo(() => ({ event: "Event", tasks: "Tasks" }), []);

    const [eventActionState, setEventActionState] = useState(defaultActionState);
    const [openTab, setTab] = useState(tabs.event);

    const updateEventById = async (
        currentActionState: FormActionState,
        fieldValues: Prisma.EventUpdateInput,
    ) => {
        return updateEvent(event[GlobalConstants.ID], currentActionState, fieldValues);
    };

    const publishEvent = async () => {
        const updateData: Prisma.EventUpdateInput = { status: GlobalConstants.PUBLISHED };
        const publishEventResult = await updateEventById(defaultActionState, updateData);
        setEventActionState(publishEventResult);
    };

    const deleteEventAndRedirect = async () => {
        const deleteResult = await deleteEvent(event[GlobalConstants.ID], defaultActionState);
        if (deleteResult.status !== 200) return setEventActionState(deleteResult);
        // Redirect to calendar when event is deleted
        redirect(`/${GlobalConstants.CALENDAR}`);
    };

    return (
        <Stack>
            <Tabs value={openTab} onChange={(_, newTab) => setTab(newTab)}>
                {Object.keys(tabs).map((tab) => (
                    <Tab key={tabs[tab]} value={tabs[tab]} label={tabs[tab]} />
                ))}
            </Tabs>
            {openTab === tabs.event && (
                <>
                    <Form
                        name={GlobalConstants.EVENT}
                        buttonLabel="save"
                        action={updateEventById}
                        defaultValues={event}
                        readOnly={!(isUserAdmin(user) || isUserHost(user, event))}
                    />
                    {getFormActionMsg(eventActionState)}
                    {isUserHost(user, event) && (
                        <Button color="success" onClick={publishEvent}>
                            publish
                        </Button>
                    )}
                    {isUserAdmin(user) && (
                        <Button color="error" onClick={deleteEventAndRedirect}>
                            delete
                        </Button>
                    )}
                </>
            )}
            {openTab === tabs.tasks && <TaskDashboard event={event} />}
        </Stack>
    );
};
export default EventDashboard;
