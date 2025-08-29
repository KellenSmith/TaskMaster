"use client";
import { Card, CardContent, Chip, Divider, Stack, Typography, useTheme } from "@mui/material";
import { isMembershipExpired } from "../../lib/definitions";
import { AdminPanelSettings, CheckCircle, Person, Schedule, Warning } from "@mui/icons-material";
import { useUserContext } from "../../context/UserContext";
import { formatDate } from "../../ui/utils";
import dayjs from "dayjs";

const MembershipStatusCard = () => {
    const theme = useTheme();
    const { user } = useUserContext();
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
                            Membership
                        </Typography>
                        {isMembershipExpired(user) ? (
                            <Chip icon={<Warning />} label="Expired" color="error" size="small" />
                        ) : (
                            <Chip
                                icon={<CheckCircle />}
                                label="Active"
                                color="success"
                                size="small"
                            />
                        )}
                    </Stack>

                    <Divider />

                    {/* Membership Info */}
                    {isMembershipExpired(user) ? (
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
                                {user.user_membership
                                    ? "Your membership has expired and needs renewal"
                                    : "Welcome! Activate your membership to get started"}
                            </Typography>
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            {/* Member Since */}
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Person color="primary" />
                                <Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        Member since
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
                                        Membership expires
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {formatDate(dayjs(user.user_membership.expires_at))}
                                    </Typography>
                                </Stack>
                            </Stack>

                            <Stack direction="row" spacing={2} alignItems="center">
                                <AdminPanelSettings color="primary" />
                                <Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        Role
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ fontWeight: 500, textTransform: "capitalize" }}
                                    >
                                        {user.role}
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
