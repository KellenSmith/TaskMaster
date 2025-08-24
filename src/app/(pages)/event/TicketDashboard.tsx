"use client";
import { Prisma } from "@prisma/client";
import { use, useMemo } from "react";
import { useUserContext } from "../../context/UserContext";
import {
    Stack,
    Typography,
    Card,
    CardContent,
    Divider,
    Chip,
    useTheme,
    alpha,
} from "@mui/material";
import { CheckCircle, ExitToApp } from "@mui/icons-material";
import ProductCard from "../../ui/shop/ProductCard";
import ConfirmButton from "../../ui/ConfirmButton";
import { useNotificationContext } from "../../context/NotificationContext";
import { deleteEventParticipant } from "../../lib/event-participant-actions";
import { useRouter } from "next/navigation";

interface TicketDashboardProps {
    eventPromise: Promise<
        Prisma.EventGetPayload<{ include: { tickets: { include: { eventParticipants: true } } } }>
    >;
    ticketsPromise: Promise<
        Prisma.TicketGetPayload<{
            include: { product: true };
        }>[]
    >;
}

const TicketDashboard = ({ eventPromise, ticketsPromise }: TicketDashboardProps) => {
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const router = useRouter();
    const theme = useTheme();
    const event = use(eventPromise);
    const tickets = use(ticketsPromise);
    const ticket = useMemo(() => {
        const participantTicket = event.tickets.find((t) =>
            t.eventParticipants.find((ep) => ep.userId === user.id),
        );
        if (!participantTicket) return null;
        return tickets.find((ticket) => ticket.id === participantTicket?.id);
    }, [tickets, user]);

    const leaveParticipantList = async () => {
        try {
            await deleteEventParticipant(event.id, user.id);
            addNotification("You have left the event", "success");
            router.refresh();
        } catch {
            addNotification("Failed to leave the event", "error");
        }
    };

    return (
        <Stack
            sx={{
                width: "100%",
                p: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
                borderRadius: 2,
                minHeight: 400,
            }}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems="center"
                spacing={3}
                height="100%"
            >
                {/* Product Card Section */}
                <Stack sx={{ flex: "0 0 auto" }}>
                    <ProductCard product={ticket?.product} />
                </Stack>

                {/* Content Section */}
                <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 4 }}>
                        {/* Header Section */}
                        <Stack sx={{ textAlign: "center", mb: 3 }}>
                            <Stack sx={{ justifyContent: "center", mb: 2 }}>
                                <Chip
                                    icon={<CheckCircle />}
                                    label="Registered"
                                    color="success"
                                    variant="outlined"
                                    size="medium"
                                    sx={{
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        px: 2,
                                        py: 1,
                                        alignSelf: "center",
                                    }}
                                />
                            </Stack>
                            <Typography variant="h4" color="primary" gutterBottom>
                                You're All Set!
                            </Typography>
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ fontWeight: 400, lineHeight: 1.6 }}
                            >
                                You have a ticket to this event. We can't wait to see you there!
                            </Typography>
                        </Stack>

                        <Divider sx={{ my: 3, opacity: 0.3 }} />

                        {/* Footer Section */}
                        <Stack sx={{ mt: "auto" }}>
                            <Stack
                                sx={{
                                    padding: 3,
                                    border: `1px solid ${theme.palette.error.dark}`,
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    textAlign="center"
                                    sx={{ mb: 2, fontWeight: 500 }}
                                >
                                    Can't make it after all?
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    textAlign="center"
                                    sx={{ mb: 3, opacity: 0.8 }}
                                >
                                    Leave the participant list to free up your spot for someone
                                    else.
                                </Typography>
                                <ConfirmButton
                                    color="error"
                                    variant="outlined"
                                    fullWidth
                                    onClick={leaveParticipantList}
                                    startIcon={<ExitToApp />}
                                    confirmText="Are you sure you want to leave this event? This action cannot be undone and you will lose your spot."
                                >
                                    Leave Participant List
                                </ConfirmButton>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Stack>
    );
};

export default TicketDashboard;
