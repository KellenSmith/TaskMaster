"use client";

import { FC, use, useState, useTransition } from "react";
import GlobalConstants from "../../GlobalConstants";
import { useUserContext } from "../../context/UserContext";
import { Button, Dialog, Menu, Stack } from "@mui/material";
import { EventStatus, Prisma } from "@prisma/client";
import Form from "../../ui/form/Form";
import { cancelEvent, deleteEvent, updateEvent } from "../../lib/event-actions";
import ConfirmButton from "../../ui/ConfirmButton";
import { navigateToRoute } from "../../ui/utils";
import { useRouter } from "next/navigation";
import { sendMassEmail } from "../../lib/mail-service/mail-service";
import AccordionRadioGroup from "../../ui/AccordionRadioGroup";
import { pdf } from "@react-pdf/renderer";
import ParticipantListPDF from "./ParticipantListPDF";
import { MoreHoriz } from "@mui/icons-material";
import { useNotificationContext } from "../../context/NotificationContext";
import z from "zod";
import { EmailSendoutSchema, EventUpdateSchema } from "../../lib/zod-schemas";

interface IEventActions {
    event: Prisma.EventGetPayload<{
        include: { host: { select: { id: true; nickname: true } } };
    }>;
    eventParticipantsPromise: Promise<
        Prisma.ParticipantInEventGetPayload<{
            include: { user: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventReservesPromise: Promise<
        Prisma.ReserveInEventGetPayload<{
            include: { user: { select: { id: true; nickname: true } } };
        }>[]
    >;
}

const sendoutToOptions = {
    All: "All",
    Participants: "Participants",
    Reserves: "Reserves",
};

const EventActions: FC<IEventActions> = ({
    event,
    eventParticipantsPromise,
    eventReservesPromise,
}) => {
    const { user } = useUserContext();
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(null);
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const eventParticipants = use(eventParticipantsPromise);
    const eventReserves = use(eventReservesPromise);

    const [sendoutTo, setSendoutTo] = useState(sendoutToOptions.All);
    const router = useRouter();

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

    const cancelThisEvent = () =>
        startTransition(async () => {
            try {
                await cancelEvent(event.id);
                addNotification("Cancelled event and informed participants", "success");
                closeActionMenu();
            } catch (error) {
                addNotification(error.message, "error");
            }
        });

    const deleteThisEvent = () => {
        startTransition(async () => {
            try {
                await deleteEvent(event.id);
                navigateToRoute(router, [GlobalConstants.CALENDAR]);
            } catch {
                addNotification("Failed to delete event", "error");
            }
        });
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

        if (event.status === EventStatus.draft)
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

        ActionButtons.push(
            <Button
                key="edit"
                onClick={() => {
                    closeActionMenu();
                    setDialogOpen(GlobalConstants.EVENT);
                }}
            >
                edit event details
            </Button>,
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
        );

        if (event.status === EventStatus.published)
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

        // Only allow deleting events that only the host is participating in
        if (eventParticipants.length === 1 && eventParticipants[0].userId === user.id) {
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
        }

        return ActionButtons;
    };

    const updateEventById = async (parsedFieldValues: z.infer<typeof EventUpdateSchema>) => {
        await updateEvent(event[GlobalConstants.ID], parsedFieldValues);
        setDialogOpen(null);
        return "Updated event";
    };

    const sendoutToEventUsers = async (parsedFieldValues: z.infer<typeof EmailSendoutSchema>) => {
        const recipientIds = [];
        if (sendoutTo === sendoutToOptions.Participants || sendoutTo === sendoutToOptions.All) {
            eventParticipants.forEach((participant: any) => {
                recipientIds.push(participant.user.id);
            });
        }
        if (sendoutTo === sendoutToOptions.Reserves || sendoutTo === sendoutToOptions.All)
            eventReserves.forEach((reserve: any) => {
                recipientIds.push(reserve.user.id);
            });

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

        let recipientCount = eventParticipants.length;
        if (sendoutTo === sendoutToOptions.Reserves) recipientCount = eventReserves.length;
        else if (sendoutTo === sendoutToOptions.All) recipientCount += eventReserves.length;

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
                sx={{ marginRight: 4 }}
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
            <Dialog open={!!dialogOpen} onClose={() => setDialogOpen(null)} fullWidth maxWidth="xl">
                {getDialogForm()}
                <Button onClick={() => setDialogOpen(null)}>cancel</Button>
            </Dialog>
        </>
    );
};

export default EventActions;
