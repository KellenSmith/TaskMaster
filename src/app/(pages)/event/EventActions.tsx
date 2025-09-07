"use client";

import { FC, use, useState, useTransition } from "react";
import GlobalConstants from "../../GlobalConstants";
import { useUserContext } from "../../context/UserContext";
import {
    Button,
    Dialog,
    Menu,
    MenuItem,
    MenuList,
    Stack,
    useMediaQuery,
    useTheme,
} from "@mui/material";
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
import { CloneEventSchema, EmailSendoutSchema, EventUpdateSchema } from "../../lib/zod-schemas";
import { getEventParticipantCount } from "./event-utils";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import { isUserAdmin, isUserHost } from "../../lib/utils";
import { CustomOptionProps } from "../../ui/form/AutocompleteWrapper";
import LanguageTranslations from "./LanguageTranslations";
import SendoutLanguageTranslations from "../sendout/LanguageTranslations";
import EventLanguageTranslations from "../profile/LanguageTranslations";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { stringsToSelectOptions } from "../../ui/form/FieldCfg";

interface IEventActions {
    eventPromise: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { event_participants: true } }; event_reserves: true };
        }>
    >;
    locationsPromise: Promise<Prisma.LocationGetPayload<true>[]>;
    eventTagsPromise: Promise<string[]>;
}

const EventActions: FC<IEventActions> = ({ eventPromise, locationsPromise, eventTagsPromise }) => {
    const theme = useTheme();
    const { organizationSettings } = useOrganizationSettingsContext();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
    const { user, language } = useUserContext();
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(null);
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const event = use(eventPromise);
    const [isCloneEventDialogOpen, setIsCloneEventDialogOpen] = useState(false);
    // TODO: It doesn't need to use locations if the user is not host or admin
    // Move host actions to separate component to optimize data fetching
    const locations = use(locationsPromise);
    const eventTags = use(eventTagsPromise);

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

    const [sendoutTo, setSendoutTo] = useState(sendoutToOptions.All[language]);

    const submitForApproval = () => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append(GlobalConstants.STATUS, EventStatus.pending_approval);
                await updateEvent(event.id, formData);
                addNotification(LanguageTranslations.submittedEvent[language], "success");
                closeActionMenu();
            } catch {
                addNotification(LanguageTranslations.failedSubmitEvent[language], "error");
            }
        });
    };

    const publishEvent = () => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append(GlobalConstants.STATUS, EventStatus.published);
                await updateEvent(event.id, formData);
                addNotification(LanguageTranslations.publishedEvent[language], "success");
                closeActionMenu();
            } catch {
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
            } catch {
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

    const cloneAction = async (formData: FormData) => {
        await cloneEvent(event.id, formData);
        return GlobalLanguageTranslations.successfulSave[language];
    };

    const printParticipantList = async () => {
        startTransition(async () => {
            try {
                const eventParticipants = await getEventParticipants(event.id);
                const taskSchedule = await pdf(
                    <ParticipantListPDF
                        event={event}
                        eventParticipants={eventParticipants}
                        language={language}
                    />,
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

    const getStatusActionButton = () => {
        const requireApprovalBeforePublish = !!organizationSettings.event_manager_email;
        switch (event.status) {
            case EventStatus.draft: {
                if (requireApprovalBeforePublish) {
                    return (
                        <MenuItem key="statusAction">
                            <ConfirmButton
                                color="success"
                                confirmText={LanguageTranslations.areYouSureSubmitEvent[language]}
                                onClick={submitForApproval}
                            >
                                {LanguageTranslations.submitEvent[language]}
                            </ConfirmButton>
                        </MenuItem>
                    );
                }
                return (
                    <MenuItem key="statusAction">
                        <ConfirmButton
                            color="success"
                            confirmText={LanguageTranslations.areYouSurePublishEvent[language]}
                            onClick={publishEvent}
                        >
                            {LanguageTranslations.publishEvent[language]}
                        </ConfirmButton>
                    </MenuItem>
                );
            }
            case EventStatus.pending_approval: {
                if (isUserAdmin(user))
                    return (
                        <MenuItem key="statusAction">
                            <ConfirmButton
                                color="success"
                                confirmText={LanguageTranslations.areYouSurePublishEvent[language]}
                                onClick={publishEvent}
                            >
                                {LanguageTranslations.publishEvent[language]}
                            </ConfirmButton>
                        </MenuItem>
                    );
                return (
                    <MenuItem key="statusAction">
                        <Button disabled>
                            {EventLanguageTranslations[event.status][language] as string}
                        </Button>
                    </MenuItem>
                );
            }
            case EventStatus.published: {
                return (
                    <MenuItem key="statusAction">
                        <ConfirmButton
                            color="error"
                            confirmText={LanguageTranslations.areYouSureCancelEvent[language](
                                getEventParticipantCount(event),
                            )}
                            onClick={cancelAction}
                        >
                            {LanguageTranslations.cancelEvent[language] as string}
                        </ConfirmButton>
                    </MenuItem>
                );
            }
        }
    };

    const getMenuItems = () => {
        const ActionButtons = [
            <MenuItem key="clone">
                <Button onClick={() => setIsCloneEventDialogOpen(true)}>
                    {LanguageTranslations.cloneEvent[language]}
                </Button>
            </MenuItem>,
        ];

        if (!(isUserHost(user, event) || isUserAdmin(user))) return ActionButtons;

        // Only allow deleting events that only the host is participating in
        if (
            getEventParticipantCount(event) === 1 &&
            event.tickets.map((ticket) => ticket.event_participants).flat()[0].user_id === user.id
        ) {
            ActionButtons.unshift(
                <MenuItem key="delete">
                    <ConfirmButton color="error" onClick={deleteAction}>
                        {LanguageTranslations.deleteEvent[language]}
                    </ConfirmButton>
                </MenuItem>,
            );
        }

        ActionButtons.unshift(getStatusActionButton());

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

    const updateEventById = async (formData: FormData) => {
        try {
            await updateEvent(event.id, formData);
            setDialogOpen(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const sendoutToEventUsers = async (formData: FormData) => {
        const recipientIds: string[] = [];
        if (
            sendoutTo === sendoutToOptions.Participants[language] ||
            sendoutTo === sendoutToOptions.All[language]
        ) {
            const eventParticipants = event.tickets
                .map((ticket) => ticket.event_participants)
                .flat();

            recipientIds.push(...eventParticipants.map((ep) => ep.user_id));
        }
        if (
            sendoutTo === sendoutToOptions.Reserves[language] ||
            sendoutTo === sendoutToOptions.All[language]
        )
            recipientIds.push(...event.event_reserves.map((er) => er.user_id));

        const recipientCriteria: Prisma.UserWhereInput = {
            id: {
                in: recipientIds,
            },
        };

        try {
            const result = await sendMassEmail(recipientCriteria, formData);
            setDialogOpen(null);
            return SendoutLanguageTranslations.successfulSendout[language](result);
        } catch {
            throw new Error(SendoutLanguageTranslations.failedSendMail[language]);
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
                    customOptions={{
                        [GlobalConstants.LOCATION_ID]: getLocationOptions(),
                        [GlobalConstants.TAGS]: stringsToSelectOptions(eventTags),
                    }}
                    defaultValues={event}
                />
            );

        let recipientCount = getEventParticipantCount(event);
        if (sendoutTo === sendoutToOptions.Reserves[language])
            recipientCount = event.event_reserves.length;
        else if (sendoutTo === sendoutToOptions.All[language])
            recipientCount += event.event_reserves.length;

        return (
            <>
                <AccordionRadioGroup
                    title={SendoutLanguageTranslations.sendToRecipients[language](recipientCount)}
                    value={sendoutTo}
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
                    buttonLabel={SendoutLanguageTranslations.send[language]}
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
            <Dialog
                fullScreen={isSmallScreen}
                open={!!dialogOpen}
                onClose={() => setDialogOpen(null)}
                fullWidth
                maxWidth="xl"
            >
                {getDialogForm()}
                <Button onClick={() => setDialogOpen(null)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
            <Dialog
                fullScreen={isSmallScreen}
                open={isCloneEventDialogOpen}
                onClose={() => setIsCloneEventDialogOpen(false)}
                fullWidth
                maxWidth="xl"
            >
                <Form
                    name={GlobalConstants.CLONE_EVENT}
                    validationSchema={CloneEventSchema}
                    defaultValues={event}
                    action={cloneAction}
                    editable={true}
                    readOnly={false}
                />
            </Dialog>
        </>
    );
};

export default EventActions;
