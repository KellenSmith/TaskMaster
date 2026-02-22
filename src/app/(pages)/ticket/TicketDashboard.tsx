"use client";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { Prisma } from "../../../prisma/generated/browser";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LangaugeTranslations";
import { use, useEffect } from "react";
import dayjs from "dayjs";
import { formatDate } from "../../ui/utils";
import { checkInEventParticipant } from "../../lib/event-participant-actions";
import { useNotificationContext } from "../../context/NotificationContext";

interface TicketDashboardProps {
    eventParticipantPromise: Promise<Prisma.EventParticipantGetPayload<{
        include: {
            ticket: { include: { event: true } };
            user: { select: { id: true; nickname: true } };
        };
    }> | null>;
}

const NoTicketFound = () => {
    const { language } = useUserContext();
    return (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 } }}>
            <Paper
                elevation={2}
                sx={{
                    border: "2px solid",
                    borderColor: "error.main",
                    borderRadius: 2,
                    p: { xs: 2, sm: 3 },
                    maxWidth: 720,
                    mx: "auto",
                }}
            >
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                    <Stack spacing={{ xs: 1, sm: 2 }} justifyContent="space-between">
                        <Chip label={LanguageTranslations.missingData[language]} color="error" />
                        <Typography variant="h4" component="h1">
                            {LanguageTranslations.ticketNotFound[language]}
                        </Typography>
                    </Stack>

                    <Typography variant="body1">
                        {LanguageTranslations.ticketNorFoundDetails[language]}{" "}
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
};

const TicketDashboard = ({ eventParticipantPromise }: TicketDashboardProps) => {
    const eventParticipant = use(eventParticipantPromise);

    if (!eventParticipant) return <NoTicketFound />;

    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();

    const checkInEventParticipantAction = async () => {
        try {
            // Dont check in if not within one hour of event opening hours
            const now = dayjs.utc();
            const eventStart = dayjs(eventParticipant.ticket.event.start_time);
            const eventEnd = dayjs(eventParticipant.ticket.event.end_time);
            if (
                now.isBefore(eventStart.subtract(1, "hour")) ||
                now.isAfter(eventEnd.add(1, "hour"))
            ) {
                return;
            }

            const result = await checkInEventParticipant(eventParticipant.id);
            if (result) addNotification(result, "error");
        } catch {
            addNotification(LanguageTranslations.checkInFailed[language], "error");
        }
    };

    useEffect(() => {
        checkInEventParticipantAction();
        // Check in the participant once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ticket = eventParticipant.ticket;
    const event = eventParticipant.ticket.event;
    const user = eventParticipant.user;

    const eventTitle = event?.title ?? null;
    const eventStart = event?.start_time ?? null;
    const eventEnd = event?.end_time ?? null;
    const ticketType = ticket?.type ?? null;
    const userNickname = user?.nickname ?? null;

    const hasAllProperties = Boolean(
        eventTitle && eventStart && eventEnd && ticketType && userNickname,
    );

    const startWindow = eventStart ? dayjs.utc(eventStart).subtract(1, "hour") : null;
    const endWindow = eventEnd ? dayjs.utc(eventEnd).add(1, "hour") : null;
    const now = dayjs.utc();

    const isWithinWindow = Boolean(
        startWindow && endWindow && now.isAfter(startWindow) && now.isBefore(endWindow),
    );
    // Consider already checked in if checked_in_at is set and is before now minus 10 seconds (to account for small delays)
    const alreadyCheckedIn =
        !!eventParticipant.checked_in_at &&
        dayjs.utc(eventParticipant.checked_in_at).isBefore(now.subtract(10, "seconds"));
    let statusColor: "success" | "warning" | "error";
    let statusText: string;
    let title: string;
    if (!hasAllProperties) {
        statusColor = "error";
        statusText = LanguageTranslations.missingData[language];
        title = "Error";
    } else if (!isWithinWindow) {
        statusColor = "warning";
        statusText = LanguageTranslations.eventNotOngoing[language];
        title = "Not ongoing";
    } else {
        statusColor = "success";
        statusText = LanguageTranslations.valid[language];
        title = "Valid";
    }

    return (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 } }}>
            <Paper
                elevation={2}
                sx={{
                    border: "2px solid",
                    borderColor: `${statusColor}.main`,
                    borderRadius: 2,
                    p: { xs: 2, sm: 3 },
                    maxWidth: 720,
                    mx: "auto",
                }}
            >
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                    <Chip label={title} color={statusColor} />
                    {hasAllProperties && (
                        <Typography>{LanguageTranslations.thisIsATicket[language]}</Typography>
                    )}
                    {!alreadyCheckedIn && (
                        <Typography>{LanguageTranslations.ticketScanInfo[language]}</Typography>
                    )}
                    <Typography>{statusText}</Typography>
                    <Stack spacing={{ xs: 1, sm: 1.25 }}>
                        <Typography variant="h5">
                            {eventTitle ?? LanguageTranslations.eventTitleMissing[language]}
                        </Typography>
                        <Typography>
                            {(eventStart
                                ? formatDate(eventStart)
                                : LanguageTranslations.startMissing[language]) +
                                " - " +
                                (eventEnd
                                    ? formatDate(eventEnd)
                                    : LanguageTranslations.endMissing[language])}
                        </Typography>
                        <Typography>
                            {`${LanguageTranslations.belongsTo[language]}: ${userNickname ?? LanguageTranslations.userNicknameMissing[language]}`}
                        </Typography>
                        <Typography>
                            {`${LanguageTranslations.ticketType[language]}: ${ticketType ?? LanguageTranslations.ticketTypeMissing[language]}`}
                        </Typography>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
};

export default TicketDashboard;
