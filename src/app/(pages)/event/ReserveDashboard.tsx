import { Prisma } from "@prisma/client";
import { useNotificationContext } from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";
import { addEventReserve, deleteEventReserve } from "../../lib/event-reserve-actions";
import { use } from "react";
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
import { CheckCircle, ExitToApp, PersonAdd } from "@mui/icons-material";
import ConfirmButton from "../../ui/ConfirmButton";
import { isUserReserve } from "./event-utils";

interface ReserveDashboardProps {
    eventPromise: Promise<Prisma.EventGetPayload<true>>;
    eventReservesPromise: Promise<
        Prisma.EventReserveGetPayload<{
            include: { user: { select: { id: true } } };
        }>[]
    >;
}

const ReserveDashboard = ({ eventPromise, eventReservesPromise }: ReserveDashboardProps) => {
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const theme = useTheme();
    const event = use(eventPromise);
    const eventReserves = use(eventReservesPromise);

    const isReserve = isUserReserve(user, eventReserves);

    const joinReserveList = async () => {
        try {
            await addEventReserve(user.id, event.id);
            addNotification("You have been added to the reserve list.", "success");
        } catch {
            addNotification("Failed to add you to the reserve list.", "error");
        }
    };

    const leaveReserveList = async () => {
        try {
            await deleteEventReserve(user.id, event.id);
            addNotification("You have been removed from the reserve list.", "success");
        } catch {
            addNotification("Failed to remove you from the reserve list.", "error");
        }
    };

    return (
        <Stack
            sx={{
                width: "100%",
                height: "100%",
                padding: 3,
            }}
        >
            <Card sx={{ flex: 1 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack alignItems="center" justifyContent="center" spacing={2}>
                        {isReserve && (
                            <Chip
                                icon={<CheckCircle />}
                                label={"On Reserve List"}
                                color={"success"}
                                variant="outlined"
                                size="medium"
                            />
                        )}
                        <Typography variant="h4" color="primary" gutterBottom>
                            {isReserve
                                ? "You're on the Reserve List!"
                                : "Sorry, this event is sold out"}
                        </Typography>
                        {isReserve && (
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ fontWeight: 400, lineHeight: 1.6 }}
                            >
                                If a spot opens up, you'll be notified.
                            </Typography>
                        )}
                    </Stack>
                    <Divider sx={{ my: 3, opacity: 0.3 }} />
                    <Stack
                        mt="auto"
                        padding={3}
                        border={`1px solid ${theme.palette.info.dark}`}
                        borderRadius={2}
                    >
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            textAlign="center"
                            sx={{ mb: 2, fontWeight: 500 }}
                        >
                            {isReserve
                                ? "Leave the reserve list to stop receiving notifications."
                                : "Join the reserve list to be notified if a spot opens up for this event."}
                        </Typography>
                        <ConfirmButton
                            color={isReserve ? "error" : "primary"}
                            variant="outlined"
                            fullWidth
                            onClick={isReserve ? leaveReserveList : joinReserveList}
                            startIcon={isReserve ? <ExitToApp /> : <PersonAdd />}
                            confirmText={
                                isReserve
                                    ? "Are you sure you want to leave the reserve list? You will not be notified if a spot opens up."
                                    : "Are you sure you want to join the reserve list? You'll be notified if a spot opens up."
                            }
                        >
                            {isReserve ? "Leave Reserve List" : "Join Reserve List"}
                        </ConfirmButton>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
};

export default ReserveDashboard;
