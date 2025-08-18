"use client";

import { FC, use, useMemo, useState, useTransition } from "react";
import { defaultFormActionState, FormActionState, isUserHost } from "../../../lib/definitions";
import GlobalConstants from "../../../GlobalConstants";
import { useUserContext } from "../../../context/UserContext";
import { Button, Dialog, Menu, Stack } from "@mui/material";
import { EventStatus, Prisma } from "@prisma/client";
import Form from "../../../ui/form/Form";
import {
    addEventReserve,
    cancelEvent,
    deleteEvent,
    deleteEventParticipant,
    deleteEventReserve,
    updateEvent,
} from "../../../lib/event-actions";
import { isEventCancelled, isEventSoldOut, isUserParticipant } from "./event-utils";
import ConfirmButton from "../../../ui/ConfirmButton";
import { navigateToRoute } from "../../../ui/utils";
import { useRouter } from "next/navigation";
import { sendMassEmail } from "../../../lib/mail-service/mail-service";
import AccordionRadioGroup from "../../../ui/AccordionRadioGroup";
import { pdf } from "@react-pdf/renderer";
import ParticipantListPDF from "./ParticipantListPDF";
import { MoreHoriz } from "@mui/icons-material";
import { useNotificationContext } from "../../../context/NotificationContext";

interface IEventActions {
    event: Prisma.EventGetPayload<{
        include: { host: { select: { id: true; nickname: true } } };
    }>;
    openTab: string;
    setOpenTab: Function;
    eventParticipants: Prisma.ParticipantInEventGetPayload<{
        include: { User: { select: { id: true; nickname: true } } };
    }>[];
    eventReservesPromise: Promise<
        Prisma.ReserveInEventGetPayload<{
            include: { User: { select: { id: true; nickname: true } } };
        }>[]
    >;
}

const EventActions: FC<IEventActions> = ({
    event,
    openTab,
    setOpenTab,
    eventParticipants,
    eventReservesPromise,
}) => {
    const { user } = useUserContext();
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [dialogOpen, setDialogOpen] = useState("");
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const eventReserves = use(eventReservesPromise);
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

    const addUserAsEventReserve = () => {
        performEventAction(() =>
            addEventReserve(user[GlobalConstants.ID], event.id, defaultFormActionState),
        );
    };

    const publishEvent = () => {
        performEventAction(() =>
            updateEvent(event.id, defaultFormActionState, {
                status: EventStatus.published,
            }),
        );
    };

    const cancelThisEvent = () =>
        performEventAction(() => cancelEvent(event.id, defaultFormActionState));

    const deleteThisEvent = () =>
        performEventAction(async () => {
            const result = await deleteEvent(event.id, defaultFormActionState);
            if (result.status === 200) {
                navigateToRoute(`/${GlobalConstants.CALENDAR}`, router);
            }
        });

    const removeUserFromParticipantList = () =>
        performEventAction(() =>
            deleteEventParticipant(user[GlobalConstants.ID], event.id, defaultFormActionState),
        );

    const removeUserFromReserveList = () =>
        performEventAction(() =>
            deleteEventReserve(user[GlobalConstants.ID], event.id, defaultFormActionState),
        );

    const performEventAction = (action: Function) => {
        startTransition(async () => {
            const actionResult = await action();
            if (actionResult.status === 200) {
                addNotification(actionResult.result, "success");
                closeActionMenu();
            } else {
                addNotification(actionResult.errorMsg, "error");
            }
        });
    };

    const findReserveUserIndexById = () => {
        return eventReserves.findIndex(
            (reserve) => reserve[GlobalConstants.USER_ID] === user[GlobalConstants.ID],
        );
    };

    const printParticipantList = async () => {
        closeActionMenu();
        const taskSchedule = await pdf(
            <ParticipantListPDF event={event} eventParticipants={eventParticipants} />,
        ).toBlob();
        const url = URL.createObjectURL(taskSchedule);
        window.open(url, "_blank");
    };

    const getActionButtons = () => {
        const ActionButtons = [];
        if (isUserHost(user, event)) {
            if (
                ([EventStatus.draft, EventStatus.cancelled] as string[]).includes(
                    event.status as string,
                )
            ) {
                ActionButtons.push(
                    <ConfirmButton
                        key="publish"
                        color="success"
                        disabled={isPending}
                        onClick={publishEvent}
                    >
                        publish event
                    </ConfirmButton>,
                );
            } else {
                ActionButtons.push(
                    <ConfirmButton
                        key="cancel"
                        color="error"
                        disabled={isPending}
                        confirmText={`An info email will be sent to all ${eventParticipants.length} participants. Are you sure?`}
                        onClick={cancelThisEvent}
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
            if (eventParticipants.length === 1)
                ActionButtons.push(
                    <ConfirmButton
                        key="delete"
                        color="error"
                        disabled={isPending}
                        onClick={deleteThisEvent}
                    >
                        delete
                    </ConfirmButton>,
                );
        } else {
            if (isUserParticipant(user, eventParticipants))
                ActionButtons.push(
                    <ConfirmButton
                        key="leave participant"
                        onClick={removeUserFromParticipantList}
                        disabled={isPending}
                    >
                        leave participant list
                    </ConfirmButton>,
                );
            else if (!isEventCancelled(event)) {
                if (isEventSoldOut(event, eventParticipants)) {
                    if (findReserveUserIndexById() > -1)
                        ActionButtons.push(
                            <ConfirmButton
                                key="leave reserve"
                                onClick={removeUserFromReserveList}
                                disabled={isPending}
                            >{`leave reserve list (you are #${findReserveUserIndexById() + 1})`}</ConfirmButton>,
                        );
                    else
                        ActionButtons.push(
                            <Button
                                key="add reserve"
                                disabled={isPending}
                                onClick={addUserAsEventReserve}
                            >
                                get on reserve list
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
            eventParticipants.forEach((participant: any) => {
                recipientIds.push(participant.User.id);
            });
        }
        if (sendoutTo === sendoutToOptions.RESERVES || sendoutTo === sendoutToOptions.ALL)
            eventReserves.forEach((reserve: any) => {
                recipientIds.push(reserve.User.id);
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
        let recipientCount = eventParticipants.length;
        if (sendoutTo === sendoutToOptions.RESERVES) recipientCount = eventReserves.length;
        else if (sendoutTo === sendoutToOptions.ALL) recipientCount += eventReserves.length;
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
            <Dialog open={!!dialogOpen} onClose={() => setDialogOpen("")} fullWidth maxWidth="xl">
                {getDialogForm()}
                <Button onClick={() => setDialogOpen("")}>cancel</Button>
            </Dialog>
        </>
    );
};

export default EventActions;
