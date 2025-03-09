"use client";

import { Button, Stack, Tab, Tabs } from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { startTransition, useState } from "react";
import { isUserAdmin, isUserHost } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import TaskDashboard from "./(tasks)/TaskDashboard";
import Form, { defaultActionState, FormActionState, getFormActionMsg } from "../../ui/form/Form";
import { redirect } from "next/navigation";
import { deleteEvent, updateEvent } from "../../lib/event-actions";
import { Prisma } from "@prisma/client";

export const tabs = { event: "Event", tasks: "Participate" };

const EventDashboard = ({ event, fetchEventAction, openTab, setOpenTab }) => {
    const { user } = useUserContext();

    const [eventActionState, setEventActionState] = useState(defaultActionState);

    const updateEventById = async (
        currentActionState: FormActionState,
        fieldValues: Prisma.EventUpdateInput,
    ) => {
        const updateEventResult = await updateEvent(
            event[GlobalConstants.ID],
            currentActionState,
            fieldValues,
        );
        startTransition(() => {
            fetchEventAction();
        });
        return updateEventResult;
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
            <Tabs value={openTab} onChange={(_, newTab) => setOpenTab(newTab)}>
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
                    {isUserHost(user, event) &&
                        event[GlobalConstants.STATUS] === GlobalConstants.DRAFT && (
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
            {openTab === tabs.tasks && (
                <TaskDashboard event={event} fetchEventAction={fetchEventAction} />
            )}
        </Stack>
    );
};
export default EventDashboard;
