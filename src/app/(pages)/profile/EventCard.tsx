import { Button, Card, CardContent, Stack, Typography, Chip, Box } from "@mui/material";
import { formatDate } from "../../ui/utils";
import GlobalConstants from "../../GlobalConstants";
import { isUserHost, clientRedirect } from "../../lib/definitions";
import { isEventPublished, isUserParticipant, isUserReserve } from "../event/event-utils";
import { useUserContext } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { Prisma } from "@prisma/client";
import LanguageTranslations from "./LanguageTranslations";
import EventLanguageTranslations from "../event/LanguageTranslations";

interface EventCardProps {
    event: Prisma.EventGetPayload<{
        include: {
            location: true;
            tickets: { include: { event_participants: true } };
            event_reserves: true;
        };
    }>;
}

const EventCard: FC<EventCardProps> = ({ event }) => {
    const { user, language } = useUserContext();
    const router = useRouter();

    // Helper function to get user status
    const getStatusChipColor = () => {
        if (isUserHost(user, event)) return "secondary";
        if (isUserParticipant(user, event)) return "success";
        if (isUserReserve(user, event)) return "warning";
        return "info";
    };

    const getStatusLabel = () => {
        if (isUserHost(user, event)) return LanguageTranslations.eventHost[language];
        if (isUserParticipant(user, event)) return LanguageTranslations.participant[language];
        if (isUserReserve(user, event)) return LanguageTranslations.reserve[language];
    };

    return (
        <Card
            key={event.id}
            sx={{
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                },
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                    {/* Header with title and status chips */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                            {event.title}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {!isEventPublished(event) && (
                                <Chip
                                    label={LanguageTranslations.draft[language]}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                />
                            )}
                            <Chip
                                variant="outlined"
                                color={getStatusChipColor()}
                                label={getStatusLabel()}
                                size="small"
                            />
                        </Box>
                    </Stack>

                    {/* Event details */}
                    <Stack spacing={1}>
                        <Typography color="text.secondary">
                            <strong>{EventLanguageTranslations.start[language]}:</strong>{" "}
                            {formatDate(event.start_time)}
                        </Typography>
                        <Typography color="text.secondary">
                            <strong>{EventLanguageTranslations.end[language]}:</strong>{" "}
                            {formatDate(event.end_time)}
                        </Typography>
                        {event.location.name && (
                            <Typography color="text.secondary">
                                <strong>{LanguageTranslations.location[language]}:</strong>{" "}
                                {event.location.name}, {event.location.address}
                            </Typography>
                        )}
                    </Stack>

                    {/* Action button */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                                clientRedirect(router, [GlobalConstants.EVENT], {
                                    event_id: event.id,
                                })
                            }
                            sx={{ minWidth: 80 }}
                        >
                            {LanguageTranslations.seeEvent[language]}
                        </Button>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default EventCard;
