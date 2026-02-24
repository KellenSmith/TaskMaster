"use client";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { Prisma } from "../../../prisma/generated/browser";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LangaugeTranslations";
import { use, useEffect, useState } from "react";
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
                        {LanguageTranslations.ticketNotFoundDetails[language]}
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
};

const TicketDashboard = ({ eventParticipantPromise }: TicketDashboardProps) => {
    const eventParticipant = use(eventParticipantPromise);
    const { language } = useUserContext();

    // State for check-in result and status
    const [statusColor, setStatusColor] = useState<"success" | "warning" | "error">("warning");
    const [statusText, setStatusText] = useState<string>("");
    const [title, setTitle] = useState<string>("");

    if (!eventParticipant) {
        return <NoTicketFound />;
    }

    const ticket = eventParticipant.ticket;
    const event = eventParticipant.ticket?.event;
    const user = eventParticipant.user;

    const eventTitle = event?.title ?? null;
    const eventStart = event?.start_time ?? null;
    const eventEnd = event?.end_time ?? null;
    const ticketType = ticket?.type ?? null;
    const userNickname = user?.nickname ?? null;

    const hasAllProperties = Boolean(
        eventTitle && eventStart && eventEnd && ticketType && userNickname,
    );

    const now = dayjs.utc();
    const startWindow = eventStart ? dayjs.utc(eventStart).subtract(1, "hour") : null;
    const endWindow = eventEnd ? dayjs.utc(eventEnd).add(1, "hour") : null;
    const isWithinWindow = Boolean(
        startWindow && endWindow && now.isAfter(startWindow) && now.isBefore(endWindow),
    );
    const alreadyCheckedIn =
        !!eventParticipant.checked_in_at &&
        dayjs.utc(eventParticipant.checked_in_at).isBefore(now.subtract(10, "seconds"));

    useEffect(() => {
        // If missing props, show as invalid (red)
        if (!hasAllProperties) {
            setStatusColor("error");
            setStatusText(LanguageTranslations.missingData[language]);
            setTitle("Error");
            return;
        }

        // If outside window, show as valid but not checked in (yellow)
        if (!isWithinWindow) {
            setStatusColor("warning");
            setStatusText(LanguageTranslations.eventNotOngoing[language]);
            setTitle("Valid");
            return;
        }

        // If already checked in (more than 10s ago), show as checked in (red)
        if (alreadyCheckedIn) {
            setStatusColor("error");
            setStatusText(
                `${LanguageTranslations.alreadyCheckedIn[language]} ${formatDate(dayjs(eventParticipant.checked_in_at))}`,
            );
            setTitle("Checked in");
            return;
        }

        // If within window and not checked in, attempt check-in
        const doCheckIn = async () => {
            try {
                const result = await checkInEventParticipant(eventParticipant.id);
                if (result) {
                    // Check-in failed or already checked in
                    setStatusColor("error");
                    setStatusText(result);
                    setTitle("Valid");
                } else {
                    // Check-in succeeded
                    setStatusColor("success");
                    setStatusText(LanguageTranslations.checkInSucceeded[language]);
                    setTitle("Valid");
                }
            } catch (err) {
                setStatusColor("warning");
                setStatusText(LanguageTranslations.checkInFailed[language]);
                setTitle("Valid");
            }
        };
        doCheckIn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
