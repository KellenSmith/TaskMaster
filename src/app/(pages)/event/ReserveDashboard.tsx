import { Prisma } from "@prisma/client";
import { useNotificationContext } from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";
import { addEventReserve, deleteEventReserve } from "../../lib/event-reserve-actions";
import { use } from "react";
import { Stack, Typography, Card, CardContent, Divider, Chip, useTheme } from "@mui/material";
import { CheckCircle, ExitToApp, PersonAdd } from "@mui/icons-material";
import ConfirmButton from "../../ui/ConfirmButton";
import { isUserReserve } from "./event-utils";
import LanguageTranslations from "./LanguageTranslations";

interface ReserveDashboardProps {
    eventPromise: Promise<Prisma.EventGetPayload<{ include: { event_reserves: true } }>>;
}

const ReserveDashboard = ({ eventPromise }: ReserveDashboardProps) => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const theme = useTheme();
    const event = use(eventPromise);

    const isReserve = isUserReserve(user, event);

    const joinReserveList = async () => {
        try {
            await addEventReserve(user.id, event.id);
            addNotification(LanguageTranslations.joinedReserveList[language], "success");
        } catch {
            addNotification(LanguageTranslations.failedToAddReserve[language], "error");
        }
    };

    const leaveReserveList = async () => {
        try {
            await deleteEventReserve(user.id, event.id);
            addNotification(LanguageTranslations.leftReserveList[language], "success");
        } catch {
            addNotification(LanguageTranslations.failedToLeaveReserve[language], "error");
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
                                label={LanguageTranslations.registered[language] as string}
                                color={"success"}
                                variant="outlined"
                                size="medium"
                            />
                        )}
                        <Typography variant="h4" color="primary" gutterBottom>
                            {LanguageTranslations.sorrySoldOut[language](isReserve)}
                        </Typography>
                        {isReserve && (
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ fontWeight: 400, lineHeight: 1.6 }}
                            >
                                {LanguageTranslations.notifyIfSpotOpens[language]}
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
                            {LanguageTranslations.joinReserveToBeNotified[language](isReserve)}
                        </Typography>
                        <ConfirmButton
                            color={isReserve ? "error" : "primary"}
                            variant="outlined"
                            fullWidth
                            onClick={isReserve ? leaveReserveList : joinReserveList}
                            startIcon={isReserve ? <ExitToApp /> : <PersonAdd />}
                            confirmText={LanguageTranslations.areYouSureYouWannaJoin[language](
                                isReserve,
                            )}
                        >
                            {LanguageTranslations.joinReserveButtonLabel[language](isReserve)}
                        </ConfirmButton>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
};

export default ReserveDashboard;
