"use client"
import { Box, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import { Prisma } from "../../../prisma/generated/browser";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LangaugeTranslations";
import { use } from "react";
import dayjs from "dayjs";
import { formatDate } from "../../ui/utils";

interface TicketDashboardProps {
    eventParticipantPromise: Promise<Prisma.EventParticipantGetPayload<{ include: { ticket: { include: { event: true } }, user: { select: { id: true, nickname: true } } } }> | null>;
}

const NoTicketFound = () => {
    const { language } = useUserContext();
    return <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 } }}>
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
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 1, sm: 2 }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                >
                    <Chip label={LanguageTranslations.missingData[language]} color="error" />
                    <Typography variant="h4" component="h1">
                        {LanguageTranslations.ticketNotFound[language]}
                    </Typography>
                </Stack>

                <Typography variant="body1">
                    {LanguageTranslations.ticketNorFoundDetails[language]}                    </Typography>
            </Stack>
        </Paper>
    </Box>
}

const TicketDashboard = ({ eventParticipantPromise }: TicketDashboardProps) => {
    const { language } = useUserContext()
    const eventParticipant = use(eventParticipantPromise);

    if (!eventParticipant)
        return <NoTicketFound />;

    const ticket = eventParticipant.ticket;
    const event = eventParticipant.ticket.event;
    const user = eventParticipant.user;

    const eventTitle = event?.title ?? null;
    const eventStart = event?.start_time ?? null;
    const eventEnd = event?.end_time ?? null;
    const ticketType = ticket?.type ?? null;
    const userNickname = user?.nickname ?? null;

    const hasAllProperties = Boolean(eventTitle && eventStart && eventEnd && ticketType && userNickname);

    const startWindow = eventStart ? dayjs(eventStart).subtract(1, "hour") : null;
    const endWindow = eventEnd ? dayjs(eventEnd).add(1, "hour") : null;
    const now = dayjs();
    const isWithinWindow = Boolean(startWindow && endWindow && now.isAfter(startWindow) && now.isBefore(endWindow));

    const statusColor: "success" | "warning" | "error" = hasAllProperties
        ? (isWithinWindow ? "success" : "warning")
        : "error";

    return <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 } }}>
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
                <Chip
                    label={hasAllProperties ? (isWithinWindow ? LanguageTranslations.valid[language] : LanguageTranslations.eventNotOngoing[language]) : LanguageTranslations.missingData[language]}
                    color={statusColor}
                />
                <Typography>
                    {LanguageTranslations.thisIsATicket[language]}
                </Typography>
                <Typography>{LanguageTranslations.ticketScanInfo[language]}</Typography>
                <Stack spacing={{ xs: 1, sm: 1.25 }}>
                    <Typography variant="h5">
                        {eventTitle ?? LanguageTranslations.eventTitleMissing[language]}
                    </Typography>
                    <Typography >
                        {(eventStart ? formatDate(eventStart) : LanguageTranslations.startMissing[language])
                            + " - " +
                            (eventEnd ? formatDate(eventEnd) : LanguageTranslations.endMissing[language])}
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
}

export default TicketDashboard
