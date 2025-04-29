"use client";

import { FC, startTransition, useActionState, useState } from "react";
import { isUserHost } from "../../../lib/definitions";
import GlobalConstants from "../../../GlobalConstants";
import { useUserContext } from "../../../context/UserContext";
import { Button, Dialog } from "@mui/material";
import { Prisma } from "@prisma/client";
import Form, { defaultActionState, FormActionState, getFormActionMsg } from "../../../ui/form/Form";
import {
    addEventReserve,
    deleteEvent,
    deleteEventParticipant,
    deleteEventReserve,
    updateEvent,
} from "../../../lib/event-actions";
import { tabs } from "./EventDashboard";
import { isEventSoldOut, isUserParticipant } from "./event-utils";
import ConfirmButton from "../../../ui/ConfirmButton";
import { navigateToRoute } from "../../../ui/utils";
import { useRouter } from "next/navigation";

interface IEventActions {
    event: any;
    fetchEventAction: Function;
    openTab: string;
    setOpenTab: Function;
}

const EventActions: FC<IEventActions> = ({ event, fetchEventAction, openTab, setOpenTab }) => {
    const { user } = useUserContext();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const router = useRouter();

    const [addReserveActionState, addReserveAction, isAddReservePending] = useActionState(
        (currentActionState: FormActionState) =>
            addEventReserve(
                user[GlobalConstants.ID],
                event[GlobalConstants.ID],
                currentActionState,
            ),
        defaultActionState,
    );

    const [publishActionState, publishAction, isPublishPending] = useActionState(
        (currentActionState: FormActionState) =>
            updateEvent(event[GlobalConstants.ID], currentActionState, {
                status: GlobalConstants.PUBLISHED,
            }),
        defaultActionState,
    );

    const [deleteActionState, deleteAction, isDeletePending] = useActionState(
        async (currentActionState: FormActionState) => {
            const result = await deleteEvent(event[GlobalConstants.ID], currentActionState);
            if (result.status === 200) {
                navigateToRoute(`/${GlobalConstants.CALENDAR}`, router);
            }
            return result;
        },
        defaultActionState,
    );

    const [removeParticipantActionState, removeParticipantAction, isRemoveParticipantPending] =
        useActionState(
            (currentActionState: FormActionState) =>
                deleteEventParticipant(
                    user[GlobalConstants.ID],
                    event[GlobalConstants.ID],
                    currentActionState,
                ),
            defaultActionState,
        );

    const [removeReserveActionState, removeReserveAction, isRemoveReservePending] = useActionState(
        (currentActionState: FormActionState) =>
            deleteEventReserve(
                user[GlobalConstants.ID],
                event[GlobalConstants.ID],
                currentActionState,
            ),
        defaultActionState,
    );

    const actAndUpdateEvent = (action: Function) => {
        startTransition(() => {
            action();
            fetchEventAction();
        });
    };

    const findReserveUserIndexById = () => {
        if (!event) return -1;
        return event[GlobalConstants.RESERVE_USERS].findIndex(
            (reserve) => reserve[GlobalConstants.USER_ID] === user[GlobalConstants.ID],
        );
    };

    const getActionButtons = () => {
        const ActionButtons = [];
        if (isUserHost(user, event)) {
            if (event[GlobalConstants.STATUS] === GlobalConstants.DRAFT) {
                ActionButtons.push(
                    <ConfirmButton
                        key="publish"
                        color="success"
                        disabled={isPublishPending}
                        onClick={() => actAndUpdateEvent(publishAction)}
                    >
                        publish
                    </ConfirmButton>,
                );
            }
            ActionButtons.push(
                <Button key="edit" onClick={() => setEditDialogOpen(true)}>
                    edit event details
                </Button>,
                <ConfirmButton
                    key="delete"
                    color="error"
                    disabled={isDeletePending}
                    onClick={deleteAction}
                >
                    delete
                </ConfirmButton>,
            );
        } else {
            if (isUserParticipant(user, event))
                ActionButtons.push(
                    <ConfirmButton
                        key="leave participant"
                        onClick={() => actAndUpdateEvent(removeParticipantAction)}
                        disabled={isRemoveParticipantPending}
                    >
                        leave participant list
                    </ConfirmButton>,
                );
            else {
                if (isEventSoldOut(event)) {
                    if (findReserveUserIndexById() > -1)
                        ActionButtons.push(
                            <ConfirmButton
                                key="leave reserve"
                                onClick={() => actAndUpdateEvent(removeReserveAction)}
                                disabled={isRemoveReservePending}
                            >{`leave reserve list (you are #${findReserveUserIndexById() + 1})`}</ConfirmButton>,
                        );
                    else
                        ActionButtons.push(
                            <Button
                                key="add reserve"
                                disabled={isAddReservePending}
                                onClick={() => actAndUpdateEvent(addReserveAction)}
                            >
                                get on reserve list
                            </Button>,
                        );
                } else if (openTab !== tabs.tasks) {
                    ActionButtons.push(
                        <Button onClick={() => setOpenTab(tabs.tasks)}>participate</Button>,
                    );
                }
            }
        }
        return ActionButtons;
    };

    const updateEventById = (
        currentActionState: FormActionState,
        fieldValues: Prisma.EventUpdateInput,
    ) => updateEvent(event[GlobalConstants.ID], currentActionState, fieldValues);

    return (
        <>
            {getActionButtons()}
            {getFormActionMsg(addReserveActionState)}
            {getFormActionMsg(deleteActionState)}
            {getFormActionMsg(publishActionState)}
            {getFormActionMsg(removeParticipantActionState)}
            {getFormActionMsg(removeReserveActionState)}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                fullWidth
                maxWidth="xl"
            >
                <Form
                    name={GlobalConstants.EVENT}
                    buttonLabel="save"
                    readOnly={false}
                    action={updateEventById}
                    defaultValues={event}
                    editable={isUserHost(user, event)}
                />
                <Button onClick={() => setEditDialogOpen(false)}>cancel</Button>
            </Dialog>
        </>
    );
};

export default EventActions;
