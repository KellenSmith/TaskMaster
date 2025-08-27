"use client";

import { FC, use, useState, useTransition } from "react";
import GlobalConstants from "../../GlobalConstants";
import { useUserContext } from "../../context/UserContext";
import { Button, Dialog, Menu, MenuItem, MenuList, Stack } from "@mui/material";
import { EventStatus, Prisma } from "@prisma/client";
import Form from "../../ui/form/Form";
import {
    cancelEvent,
    cloneEvent,
    deleteEvent,
    getEventParticipants,
    updateEvent,
} from "../../lib/event-actions";
import ConfirmButton from "../../ui/ConfirmButton";
import { allowRedirectException } from "../../ui/utils";
import { sendMassEmail } from "../../lib/mail-service/mail-service";
import AccordionRadioGroup from "../../ui/AccordionRadioGroup";
import { pdf } from "@react-pdf/renderer";
import ParticipantListPDF from "./ParticipantListPDF";
import { MoreHoriz } from "@mui/icons-material";
import { useNotificationContext } from "../../context/NotificationContext";
import z from "zod";
import { EmailSendoutSchema, EventUpdateSchema } from "../../lib/zod-schemas";
import { getEventParticipantCount } from "./event-utils";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import { isUserAdmin, isUserHost } from "../../lib/definitions";

interface IEventActions {
    eventPromise: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { eventParticipants: true } }; eventReserves: true };
        }>
    >;
}

const sendoutToOptions = {
    All: "All",
    Participants: "Participants",
    Reserves: "Reserves",
};

const EventActions: FC<IEventActions> = ({ eventPromise }) => {
    const { user } = useUserContext();
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(null);
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const event = use(eventPromise);

    const [sendoutTo, setSendoutTo] = useState(sendoutToOptions.All);

    const publishEvent = () => {
        startTransition(async () => {
            try {
                await updateEvent(event.id, {
                    status: EventStatus.published,
                });
                addNotification("Published event", "success");
                closeActionMenu();
            } catch (error) {
                addNotification(error.message, "error");
            }
        });
    };

    const cancelAction = () =>
        startTransition(async () => {
            try {
                await cancelEvent(event.id);
                addNotification("Cancelled event and informed participants", "success");
                closeActionMenu();
            } catch (error) {
                addNotification(error.message, "error");
            }
        });

    const deleteAction = () => {
        startTransition(async () => {
            try {
                await deleteEvent(event.id);
            } catch (error) {
                allowRedirectException(error);
                addNotification("Failed to delete event", "error");
            }
        });
    };

    const cloneAction = () => {
        startTransition(async () => {
            try {
                await cloneEvent(user.id, event.id);
            } catch (error) {
                allowRedirectException(error);
                addNotification("Failed to clone event", "error");
            }
        });
    };

    const printParticipantList = async () => {
        startTransition(async () => {
            try {
                const eventParticipants = await getEventParticipants(event.id);
                const taskSchedule = await pdf(
                    <ParticipantListPDF event={event} eventParticipants={eventParticipants} />,
                ).toBlob();
                const url = URL.createObjectURL(taskSchedule);
                window.open(url, "_blank");
                closeActionMenu();
            } catch {
                addNotification("Failed to print participant list", "error");
            }
        });
    };

    const getMenuItems = () => {
        const ActionButtons = [
            <MenuItem key="clone">
                <ConfirmButton
                    onClick={cloneAction}
                    confirmText="Are you sure you want to clone this event?"
                >
                    clone event
                </ConfirmButton>
            </MenuItem>,
        ];

        if (!(isUserHost(user, event) || isUserAdmin(user))) return ActionButtons;

        // Only allow deleting events that only the host is participating in
        if (
            getEventParticipantCount(event) === 1 &&
            event.tickets[0].eventParticipants[0].userId === user.id
        ) {
            ActionButtons.unshift(
                <MenuItem key="delete">
                    <ConfirmButton color="error" onClick={deleteAction}>
                        delete event
                    </ConfirmButton>
                </MenuItem>,
            );
        }

        if (event.status !== EventStatus.cancelled)
            ActionButtons.unshift(
                <MenuItem key="statusAction">
                    {event.status === EventStatus.published ? (
                        <ConfirmButton
                            color="error"
                            confirmText={`An info email will be sent to all ${getEventParticipantCount(event)} participants. Are you sure?`}
                            onClick={cancelAction}
                        >
                            cancel event
                        </ConfirmButton>
                    ) : (
                        <ConfirmButton
                            color="success"
                            confirmText="This event will now be visible to all members. Are you sure?"
                            onClick={publishEvent}
                        >
                            publish event
                        </ConfirmButton>
                    )}
                </MenuItem>,
            );

        ActionButtons.unshift(
            <MenuItem key="edit">
                <Button
                    onClick={() => {
                        closeActionMenu();
                        setDialogOpen(GlobalConstants.EVENT);
                    }}
                >
                    edit event details
                </Button>
            </MenuItem>,
            <MenuItem key="sendout">
                <Button
                    onClick={() => {
                        closeActionMenu();
                        setDialogOpen(GlobalConstants.SENDOUT);
                    }}
                >
                    send mail to users
                </Button>
            </MenuItem>,
            <MenuItem key="print">
                <Button onClick={printParticipantList}>print participant list</Button>
            </MenuItem>,
        );

        return ActionButtons;
    };

    const updateEventById = async (parsedFieldValues: z.infer<typeof EventUpdateSchema>) => {
        await updateEvent(event[GlobalConstants.ID], parsedFieldValues);
        setDialogOpen(null);
        return "Updated event";
    };

    const sendoutToEventUsers = async (parsedFieldValues: z.infer<typeof EmailSendoutSchema>) => {
        const recipientIds: string[] = [];
        if (sendoutTo === sendoutToOptions.Participants || sendoutTo === sendoutToOptions.All) {
            const eventParticipants = event.tickets
                .map((ticket) => ticket.eventParticipants)
                .flat();

            recipientIds.push(...eventParticipants.map((ep) => ep.userId));
        }
        if (sendoutTo === sendoutToOptions.Reserves || sendoutTo === sendoutToOptions.All)
            recipientIds.push(...event.eventReserves.map((er) => er.userId));

        const recipientCriteria: Prisma.UserWhereInput = {
            id: {
                in: recipientIds,
            },
        };

        try {
            const result = await sendMassEmail(recipientCriteria, parsedFieldValues);
            setDialogOpen(null);
            return result;
        } catch {
            console.error("Failed to send email to participants");
            throw new Error("Failed to send email");
        }
    };

    const getDialogForm = () => {
        if (!dialogOpen) return null;
        if (dialogOpen === GlobalConstants.EVENT)
            return (
                <Form
                    name={dialogOpen}
                    readOnly={false}
                    action={updateEventById}
                    validationSchema={EventUpdateSchema}
                    defaultValues={event}
                />
            );

        let recipientCount = getEventParticipantCount(event);
        if (sendoutTo === sendoutToOptions.Reserves) recipientCount = event.eventReserves.length;
        else if (sendoutTo === sendoutToOptions.All) recipientCount += event.eventReserves.length;

        return (
            <>
                <AccordionRadioGroup
                    title={`Send to ${recipientCount} recipients`}
                    value={sendoutTo}
                    setValue={setSendoutTo}
                    valueOptions={sendoutToOptions}
                />
                <Form
                    name={dialogOpen}
                    buttonLabel={"send"}
                    readOnly={false}
                    action={sendoutToEventUsers}
                    validationSchema={EmailSendoutSchema}
                    defaultValues={event}
                />
            </>
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
                sx={{ display: "flex", flexDirection: "column" }}
                anchorEl={actionMenuAnchorEl}
                keepMounted
                open={Boolean(actionMenuAnchorEl)}
                onClose={closeActionMenu}
            >
                <MenuList>
                    {isPending ? (
                        <Stack height={300} width={300}>
                            <LoadingFallback />
                        </Stack>
                    ) : (
                        getMenuItems()
                    )}
                </MenuList>
            </Menu>
            <Dialog open={!!dialogOpen} onClose={() => setDialogOpen(null)} fullWidth maxWidth="xl">
                {getDialogForm()}
                <Button onClick={() => setDialogOpen(null)}>cancel</Button>
            </Dialog>
        </>
    );
};

export default EventActions;
