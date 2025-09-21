"use client";
import { Card, CardContent, Chip, Divider, Stack, Typography, useTheme } from "@mui/material";
import { isMembershipExpired } from "../../lib/utils";
import {
    AdminPanelSettings,
    CheckCircle,
    Person,
    Schedule,
    Subscriptions,
    Warning,
} from "@mui/icons-material";
import { useUserContext } from "../../context/UserContext";
import { formatDate, userHasActiveMembershipSubscription } from "../../ui/utils";
import dayjs from "dayjs";
import LanguageTranslations from "./LanguageTranslations";
import { UserStatus } from "@prisma/client";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";

const MembershipStatusCard = () => {
    const theme = useTheme();
    const { user, language } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    return (
        <Card elevation={3}>
            <CardContent>
                <Stack spacing={3}>
                    {/* Header */}
                    <Stack
                        display="flex"
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {LanguageTranslations.membership[language]}
                        </Typography>
                        {user.status === UserStatus.pending ? (
                            <Chip
                                icon={<Warning />}
                                label={LanguageTranslations.pending[language]}
                                color="error"
                                size="small"
                            />
                        ) : isMembershipExpired(user) ? (
                            <Chip
                                icon={<Warning />}
                                label={LanguageTranslations.expired[language]}
                                color="error"
                                size="small"
                            />
                        ) : (
                            <Chip
                                icon={<CheckCircle />}
                                label={LanguageTranslations.active[language]}
                                color="success"
                                size="small"
                            />
                        )}
                    </Stack>

                    <Divider />

                    {/* Membership Info */}
                    {user.status === UserStatus.pending ? (
                        <Stack
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: theme.palette.error.light + "20",
                                border: `1px solid ${theme.palette.error.light}`,
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    color: theme.palette.error.main,
                                    fontWeight: 500,
                                    textAlign: "center",
                                }}
                            >
                                {LanguageTranslations.membershipPendingPrompt[language]}
                            </Typography>
                        </Stack>
                    ) : isMembershipExpired(user) ? (
                        <Stack
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: theme.palette.error.light + "20",
                                border: `1px solid ${theme.palette.error.light}`,
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    color: theme.palette.error.main,
                                    fontWeight: 500,
                                    textAlign: "center",
                                }}
                            >
                                {LanguageTranslations.membershipExpiredPrompt[language](user)}
                            </Typography>
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            {/* Member Since */}
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Person color="primary" />
                                <Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {LanguageTranslations.memberSince[language]}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {formatDate(user.created_at)}
                                    </Typography>
                                </Stack>
                            </Stack>

                            {/* Expiration Date */}
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Schedule color="primary" />
                                <Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {LanguageTranslations.membershipExpires[language]}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {formatDate(dayjs.utc(user.user_membership.expires_at))}
                                    </Typography>
                                </Stack>
                            </Stack>

                            {userHasActiveMembershipSubscription(user) && (
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Subscriptions color="primary" />
                                    <Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            {LanguageTranslations.subscription[language]}
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {LanguageTranslations.automaticallyExtendedOn[language]}
                                            {dayjs
                                                .utc(user.user_membership.expires_at)
                                                .subtract(
                                                    organizationSettings.remind_membership_expires_in_days,
                                                    "day",
                                                )
                                                .format("YYYY/MM/DD")}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            )}

                            <Stack direction="row" spacing={2} alignItems="center">
                                <AdminPanelSettings color="primary" />
                                <Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {LanguageTranslations.role[language]}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ fontWeight: 500, textTransform: "capitalize" }}
                                    >
                                        {LanguageTranslations[user.role][language]}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default MembershipStatusCard;
