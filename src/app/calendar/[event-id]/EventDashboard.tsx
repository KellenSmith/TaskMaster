"use client";

import { Button, Tab, Tabs } from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { startTransition, Suspense, useActionState, useState } from "react";
import { isUserAdmin, isUserHost } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import TaskDashboard from "./(tasks)/TaskDashboard";
import Form, {
    defaultActionState as defaultFormActionState,
    FormActionState,
    getFormActionMsg,
} from "../../ui/form/Form";
import { redirect } from "next/navigation";
import { deleteEvent, updateEvent } from "../../lib/event-actions";
import { Prisma } from "@prisma/client";
import { defaultActionState as defaultDatagridActionState } from "../../ui/Datagrid";
import { getEventTasks } from "../../lib/task-actions";

export const tabs = { event: "Event", tasks: "Participate" };

const EventDashboard = ({ event, fetchEventAction, openTab, setOpenTab }) => {
    const { user } = useUserContext();
    const [eventActionState, setEventActionState] = useState(defaultFormActionState);

    const fetchEventTasks = async () => {
        return await getEventTasks(
            { eventId: event[GlobalConstants.ID] },
            defaultDatagridActionState,
        );
    };
    const [tasksActionState, fetchTasksAction, isTasksPending] = useActionState(
        fetchEventTasks,
        defaultDatagridActionState,
    );

    const changeTab = async (newTab) => {
        if (newTab === tabs.tasks) {
            startTransition(() => fetchTasksAction());
        }
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
                <TaskDashboard
                    readOnly={!isUserHost(user, event)}
                    event={event}
                    fetchEventAction={fetchEventAction}
                    tasks={tasksActionState.result}
                    fetchTasksAction={fetchTasksAction}
                    isTasksPending={isTasksPending}
                />
            )}
        </Suspense>
    );
};
export default EventDashboard;
