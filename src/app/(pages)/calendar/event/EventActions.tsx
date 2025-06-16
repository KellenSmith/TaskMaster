"use client";

import { FC, startTransition, useActionState, useMemo, useState } from "react";
import { isUserHost } from "../../../lib/definitions";
import GlobalConstants from "../../../GlobalConstants";
import { useUserContext } from "../../../context/UserContext";
import { Button, Dialog, Menu, Stack } from "@mui/material";
import { EventStatus, Prisma } from "@prisma/client";
import Form, { defaultActionState, FormActionState, getFormActionMsg } from "../../../ui/form/Form";
import {
    addEventReserve,
    cancelEvent,
    deleteEvent,
    deleteEventParticipant,
    deleteEventReserve,
    updateEvent,
} from "../../../lib/event-actions";
import { tabs } from "./EventDashboard";
import { isEventCancelled, isEventSoldOut, isUserParticipant } from "./event-utils";
import ConfirmButton from "../../../ui/ConfirmButton";
import { navigateToRoute } from "../../../ui/utils";
import { useRouter } from "next/navigation";
import { sendMassEmail } from "../../../lib/mail-service/mail-service";
import AccordionRadioGroup from "../../../ui/AccordionRadioGroup";
import { pdf } from "@react-pdf/renderer";
import ParticipantListPDF from "./ParticipantListPDF";
import { MoreHoriz } from "@mui/icons-material";

interface IEventActions {
    event: any;
    fetchEventAction: Function;
    openTab: string;
    setOpenTab: Function;
}

const EventActions: FC<IEventActions> = ({ event, fetchEventAction, openTab, setOpenTab }) => {
    const { user } = useUserContext();
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [dialogOpen, setDialogOpen] = useState("");
    const sendoutToOptions = useMemo(
        () => ({
            ALL: "All",
            PARTICIPANTS: "Participants",
            RESERVES: "Reserves",
        }),
        [],
    );
    const [sendoutTo, setSendoutTo] = useState(sendoutToOptions.ALL);
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
                status: EventStatus.published,
            }),
        defaultActionState,
    );

    const [cancelActionState, cancelAction, isCancelPending] = useActionState(
        (currentActionState: FormActionState) =>
            cancelEvent(event[GlobalConstants.ID], currentActionState),
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
        closeActionMenu();
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

    const printParticipantList = async () => {
        closeActionMenu();
        const taskSchedule = await pdf(<ParticipantListPDF event={event} />).toBlob();
        const url = URL.createObjectURL(taskSchedule);
        window.open(url, "_blank");
    };

    const getActionButtons = () => {
        const ActionButtons = [];
        if (isUserHost(user, event)) {
            if (
                [GlobalConstants.DRAFT, GlobalConstants.CANCELLED].includes(
                    event[GlobalConstants.STATUS],
                )
            ) {
                ActionButtons.push(
                    <ConfirmButton
                        key="publish"
                        color="success"
                        disabled={isPublishPending}
                        onClick={() => actAndUpdateEvent(publishAction)}
                    >
                        publish event
                    </ConfirmButton>,
                );
            } else {
                ActionButtons.push(
                    <ConfirmButton
                        key="cancel"
                        color="error"
                        disabled={isCancelPending}
                        confirmText={`An info email will be sent to all ${event[GlobalConstants.PARTICIPANT_USERS].length} participants. Are you sure?`}
                        onClick={() => actAndUpdateEvent(cancelAction)}
                    >
                        cancel event
                    </ConfirmButton>,
                );
            }
            ActionButtons.push(
                <Button
                    key={GlobalConstants.SENDOUT}
                    onClick={() => {
                        closeActionMenu();
                        setDialogOpen(GlobalConstants.SENDOUT);
                    }}
                >
                    send mail to users
                </Button>,
                <Button key="print" onClick={printParticipantList}>
                    print participant list
                </Button>,
                <Button
                    key="edit"
                    onClick={() => {
                        closeActionMenu();
                        setDialogOpen(GlobalConstants.EVENT);
                    }}
                >
                    edit event details
                </Button>,
            );
            // Only allow deleting events that only the host is participating in
            if (event[GlobalConstants.PARTICIPANT_USERS]?.length === 1)
                ActionButtons.push(
                    <ConfirmButton
                        key="delete"
                        color="error"
                        disabled={isDeletePending}
                        onClick={() => actAndUpdateEvent(deleteAction)}
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
            else if (!isEventCancelled(event)) {
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
                        <Button
                            key="participate"
                            onClick={() => {
                                closeActionMenu();
                                setOpenTab(tabs.tasks);
                            }}
                        >
                            participate
                        </Button>,
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

    const sendoutToEventUsers = async (currentActionState: FormActionState, fieldValues: any) => {
        const recipientIds = [];
        if (sendoutTo === sendoutToOptions.PARTICIPANTS || sendoutTo === sendoutToOptions.ALL) {
            event[GlobalConstants.PARTICIPANT_USERS].forEach((participant: any) => {
                recipientIds.push(participant[GlobalConstants.USER_ID]);
            });
        }
        if (sendoutTo === sendoutToOptions.RESERVES || sendoutTo === sendoutToOptions.ALL)
            event[GlobalConstants.RESERVE_USERS].forEach((reserve: any) => {
                recipientIds.push(reserve[GlobalConstants.USER_ID]);
            });
        const recipientCriteria: Prisma.UserWhereInput = {
            id: {
                in: recipientIds,
            },
        };
        fieldValues[GlobalConstants.RECIPIENT_CRITERIA] = recipientCriteria;

        return sendMassEmail(currentActionState, fieldValues);
    };

    const getDialogForm = () => {
        const buttonLabel = dialogOpen === GlobalConstants.SENDOUT ? "send" : "save";
        const action =
            dialogOpen === GlobalConstants.SENDOUT ? sendoutToEventUsers : updateEventById;
        let recipientCount = event[GlobalConstants.PARTICIPANT_USERS].length;
        if (sendoutTo === sendoutToOptions.RESERVES)
            recipientCount = event[GlobalConstants.RESERVE_USERS].length;
        else if (sendoutTo === sendoutToOptions.ALL)
            recipientCount += event[GlobalConstants.RESERVE_USERS].length;
        return (
            dialogOpen && (
                <>
                    {dialogOpen === GlobalConstants.SENDOUT && (
                        <AccordionRadioGroup
                            title={`Send to ${recipientCount} recipients`}
                            value={sendoutTo}
                            setValue={setSendoutTo}
                            valueOptions={sendoutToOptions}
                        />
                    )}
                    <Form
                        name={dialogOpen}
                        buttonLabel={buttonLabel}
                        readOnly={false}
                        action={action}
                        defaultValues={event}
                    />
                </>
            )
        );
    };

    const closeActionMenu = () => {
        setActionMenuAnchorEl(null);
    };

    return (
        <>
            <Button
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={(event) => {
                    setActionMenuAnchorEl(event.currentTarget);
                }}
            >
                <MoreHoriz />
            </Button>
            <Menu
                id="simple-menu"
                anchorEl={actionMenuAnchorEl}
                keepMounted
                open={Boolean(actionMenuAnchorEl)}
                onClose={closeActionMenu}
            >
                <Stack>{getActionButtons()}</Stack>
            </Menu>
            {getFormActionMsg(addReserveActionState)}
            {getFormActionMsg(deleteActionState)}
            {getFormActionMsg(publishActionState)}
            {getFormActionMsg(cancelActionState)}
            {getFormActionMsg(removeParticipantActionState)}
            {getFormActionMsg(removeReserveActionState)}
            <Dialog open={!!dialogOpen} onClose={() => setDialogOpen("")} fullWidth maxWidth="xl">
                {getDialogForm()}
                <Button onClick={() => setDialogOpen("")}>cancel</Button>
            </Dialog>
        </>
    );
};

export default EventActions;
