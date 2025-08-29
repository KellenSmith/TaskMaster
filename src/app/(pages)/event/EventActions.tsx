"use client";

import { FC, use, useState, useTransition } from "react";
import GlobalConstants from "../../GlobalConstants";
import { useUserContext } from "../../context/UserContext";
import { Button, Dialog, Menu, MenuItem, MenuList, Stack } from "@mui/material";
import { EventStatus, Language, Prisma } from "@prisma/client";
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
import { CustomOptionProps } from "../../ui/form/AutocompleteWrapper";
import LanguageTranslations from "./LanguageTranslations";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";

interface IEventActions {
    eventPromise: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { event_participants: true } }; event_reserves: true };
        }>
    >;
    locationsPromise: Promise<Prisma.LocationGetPayload<true>[]>;
}

const EventActions: FC<IEventActions> = ({ eventPromise, locationsPromise }) => {
    const { user, language } = useUserContext();
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(null);
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const event = use(eventPromise);
    // TODO: It doesn't need to use locations if the user is not host or admin
    // Move host actions to separate component to optimize data fetching
    const locations = use(locationsPromise);

    const sendoutToOptions = {
        All: {
            [Language.english]: "All",
            [Language.swedish]: "Alla",
        },
        Participants: {
            [Language.english]: "Participants",
            [Language.swedish]: "Deltagare",
        },
        Reserves: {
            [Language.english]: "Reserves",
            [Language.swedish]: "Reservlistan",
        },
    };

    const [sendoutTo, setSendoutTo] = useState(sendoutToOptions.All);

    const publishEvent = () => {
        startTransition(async () => {
            try {
                await updateEvent(event.id, {
                    status: EventStatus.published,
                });
                addNotification(LanguageTranslations.publishedEvent[language], "success");
                closeActionMenu();
            } catch (error) {
                addNotification(LanguageTranslations.failedPublishEvent[language], "error");
            }
        });
    };

    const cancelAction = () =>
        startTransition(async () => {
            try {
                await cancelEvent(event.id);
                addNotification(LanguageTranslations.cancelledEvent[language], "success");
                closeActionMenu();
            } catch (error) {
                addNotification(LanguageTranslations.failedToCancelEvent[language], "error");
            }
        });

    const deleteAction = () => {
        startTransition(async () => {
            try {
                await deleteEvent(event.id);
            } catch (error) {
                allowRedirectException(error);
                addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
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
                addNotification(
                    LanguageTranslations.failedToPrintParticipantList[language],
                    "error",
                );
            }
        });
    };

    const getMenuItems = () => {
        const ActionButtons = [
            <MenuItem key="clone">
                <ConfirmButton
                    onClick={cloneAction}
                    confirmText={LanguageTranslations.areYouSureClone[language]}
                >
                    {LanguageTranslations.cloneEvent[language]}
                </ConfirmButton>
            </MenuItem>,
        ];

        if (!(isUserHost(user, event) || isUserAdmin(user))) return ActionButtons;

        // Only allow deleting events that only the host is participating in
        if (
            getEventParticipantCount(event) === 1 &&
            event.tickets[0].event_participants[0].user_id === user.id
        ) {
            ActionButtons.unshift(
                <MenuItem key="delete">
                    <ConfirmButton color="error" onClick={deleteAction}>
                        {LanguageTranslations.deleteEvent[language]}
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
                            confirmText={LanguageTranslations.areYouSureCancelEvent[language](
                                getEventParticipantCount(event),
                            )}
                            onClick={cancelAction}
                        >
                            {LanguageTranslations.cancelEvent[language]}
                        </ConfirmButton>
                    ) : (
                        <ConfirmButton
                            color="success"
                            confirmText={LanguageTranslations.areYouSurePublishEvent[language]}
                            onClick={publishEvent}
                        >
                            {LanguageTranslations.publishEvent[language]}
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
                    {LanguageTranslations.editEvent[language]}
                </Button>
            </MenuItem>,
            <MenuItem key="sendout">
                <Button
                    onClick={() => {
                        closeActionMenu();
                        setDialogOpen(GlobalConstants.SENDOUT);
                    }}
                >
                    {LanguageTranslations.sendMail[language]}
                </Button>
            </MenuItem>,
            <MenuItem key="print">
                <Button onClick={printParticipantList}>
                    {LanguageTranslations.printParticipantList[language]}
                </Button>
            </MenuItem>,
        );

        return ActionButtons;
    };

    const updateEventById = async (parsedFieldValues: z.infer<typeof EventUpdateSchema>) => {
        try {
            await updateEvent(event.id, parsedFieldValues);
            setDialogOpen(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const sendoutToEventUsers = async (parsedFieldValues: z.infer<typeof EmailSendoutSchema>) => {
        const recipientIds: string[] = [];
        if (
            sendoutTo[language] === sendoutToOptions.Participants[language] ||
            sendoutTo[language] === sendoutToOptions.All[language]
        ) {
            const eventParticipants = event.tickets
                .map((ticket) => ticket.event_participants)
                .flat();

            recipientIds.push(...eventParticipants.map((ep) => ep.user_id));
        }
        if (
            sendoutTo[language] === sendoutToOptions.Reserves[language] ||
            sendoutTo[language] === sendoutToOptions.All[language]
        )
            recipientIds.push(...event.event_reserves.map((er) => er.user_id));

        const recipientCriteria: Prisma.UserWhereInput = {
            id: {
                in: recipientIds,
            },
        };

        try {
            const result = await sendMassEmail(recipientCriteria, parsedFieldValues);
            setDialogOpen(null);
            return LanguageTranslations.successfulSendout[language](result);
        } catch {
            throw new Error(LanguageTranslations.failedSendMail[language]);
        }
    };

    const getLocationOptions = (): CustomOptionProps[] =>
        locations.map((location) => ({
            id: location.id,
            label: location.name,
        }));

    const getDialogForm = () => {
        if (!dialogOpen) return null;
        if (dialogOpen === GlobalConstants.EVENT)
            return (
                <Form
                    name={dialogOpen}
                    readOnly={false}
                    action={updateEventById}
                    validationSchema={EventUpdateSchema}
                    customOptions={{ [GlobalConstants.LOCATION_ID]: getLocationOptions() }}
                    defaultValues={event}
                />
            );

        let recipientCount = getEventParticipantCount(event);
        if (sendoutTo[language] === sendoutToOptions.Reserves[language])
            recipientCount = event.event_reserves.length;
        else if (sendoutTo[language] === sendoutToOptions.All[language])
            recipientCount += event.event_reserves.length;

        return (
            <>
                <AccordionRadioGroup
                    title={LanguageTranslations.sendToRecipients[language](recipientCount)}
                    value={sendoutTo[language]}
                    setValue={setSendoutTo}
                    valueOptions={Object.fromEntries(
                        Object.entries(sendoutToOptions).map(([key, value]) => [
                            key,
                            value[language],
                        ]),
                    )}
                />
                <Form
                    name={dialogOpen}
                    buttonLabel={LanguageTranslations.send[language]}
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
                <Button onClick={() => setDialogOpen(null)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </>
    );
};

export default EventActions;
