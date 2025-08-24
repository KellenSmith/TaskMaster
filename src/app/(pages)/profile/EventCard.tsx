import { Button, Card, CardContent, Stack, Typography, Chip, Box, useTheme } from "@mui/material";
import { formatDate, navigateToRoute } from "../../ui/utils";
import GlobalConstants from "../../GlobalConstants";
import { isUserHost } from "../../lib/definitions";
import { isEventPublished, isUserParticipant, isUserReserve } from "../event/event-utils";
import { useUserContext } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { Prisma } from "@prisma/client";

interface EventCardProps {
    event: Prisma.EventGetPayload<{
        include: {
            host: { select: { id: true; nickname: true } };
            eventParticipants: { include: { user: { select: { id: true; nickname: true } } } };
            eventReserves: { include: { user: { select: { id: true; nickname: true } } } };
        };
    }>;
}

const EventCard: FC<EventCardProps> = ({ event }) => {
    const { user } = useUserContext();
    const theme = useTheme();
    const router = useRouter();

    // Helper function to get user status
    const getStatusChipColor = () => {
        if (isUserHost(user, event)) return theme.palette.secondary.main;
        if (isUserParticipant(user, event.eventParticipants)) return theme.palette.success.main;
        if (isUserReserve(user, event.eventReserves)) return theme.palette.warning.main;
        return theme.palette.info.main;
    };

    const getStatusLabel = () => {
        if (isUserHost(user, event)) return "Host";
        if (isUserParticipant(user, event.eventParticipants)) return "Participant";
        if (isUserReserve(user, event.eventReserves)) return "Reserve";
        return "Unknown";
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
                                    sx={{ border: `1px solid ${getStatusChipColor()}` }}
                                    label="Draft"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                />
                            )}
                            <Chip
                                sx={{
                                    color: getStatusChipColor(),
                                    border: `1px solid ${getStatusChipColor()}`,
                                }}
                                label={getStatusLabel()}
                                size="small"
                            />
                        </Box>
                    </Stack>

                    {/* Event details */}
                    <Stack spacing={1}>
                        <Typography color="text.secondary">
                            <strong>Start:</strong> {formatDate(event.startTime)}
                        </Typography>
                        <Typography color="text.secondary">
                            <strong>End:</strong> {formatDate(event.endTime)}
                        </Typography>
                        {event.location && (
                            <Typography color="text.secondary">
                                <strong>Location:</strong> {event.location}
                            </Typography>
                        )}
                    </Stack>

                    {/* Action button */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                                navigateToRoute(router, [GlobalConstants.EVENT], {
                                    eventId: event.id,
                                })
                            }
                            sx={{ minWidth: 80 }}
                        >
                            View Event
                        </Button>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default EventCard;
