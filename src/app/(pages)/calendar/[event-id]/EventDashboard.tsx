"use client";

import { Button, Tab, Tabs } from "@mui/material";
import GlobalConstants from "../../../GlobalConstants";
import { startTransition, Suspense, useState } from "react";
import { isUserAdmin, isUserHost } from "../../../lib/definitions";
import { useUserContext } from "../../../context/UserContext";
import TaskDashboard from "./(tasks)/TaskDashboard";
import Form, {
    defaultActionState as defaultFormActionState,
    FormActionState,
    getFormActionMsg,
} from "../../../ui/form/Form";
import { redirect } from "next/navigation";
import { deleteEvent, updateEvent } from "../../../lib/event-actions";
import { Prisma } from "@prisma/client";
import ConfirmButton from "../../../ui/ConfirmButton";

export const tabs = { event: "Event", tasks: "Participate" };

const EventDashboard = ({ event, fetchEventAction, openTab, setOpenTab }) => {
    const { user } = useUserContext();
    const [eventActionState, setEventActionState] = useState(defaultFormActionState);

    const changeTab = async (newTab) => {
        setOpenTab(newTab);
    };

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
        const publishEventResult = await updateEventById(defaultFormActionState, updateData);
        setEventActionState(publishEventResult);
    };

    const deleteEventAndRedirect = async () => {
        const deleteResult = await deleteEvent(event[GlobalConstants.ID], defaultFormActionState);
        if (deleteResult.status !== 200) return setEventActionState(deleteResult);
        // Redirect to calendar when event is deleted
        redirect(`/${GlobalConstants.CALENDAR}`);
    };

    return (
        <Suspense>
            <Tabs value={openTab} onChange={(_, newTab) => changeTab(newTab)}>
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
                        editable={isUserHost(user, event)}
                    />
                    {getFormActionMsg(eventActionState)}
                    {isUserHost(user, event) &&
                        event[GlobalConstants.STATUS] === GlobalConstants.DRAFT && (
                            <Button color="success" onClick={publishEvent}>
                                publish
                            </Button>
                        )}
                    {isUserAdmin(user) && (
                        <ConfirmButton color="error" onClick={deleteEventAndRedirect}>
                            delete
                        </ConfirmButton>
                    )}
                </>
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
