"use client";
import {
    Card,
    CardContent,
    Chip,
    ChipProps,
    Divider,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import {
    AdminPanelSettings,
    CardMembership,
    CheckCircle,
    HourglassTop,
    Payments,
    Person,
    Schedule,
    Warning,
} from "@mui/icons-material";
import { useUserContext } from "../../context/UserContext";
import { formatUtcDateToTimezone } from "../../ui/utils";
import dayjs from "dayjs";
import LanguageTranslations from "./LanguageTranslations";
import { useMembershipState } from "../../lib/use-membership-state";
import { MembershipState } from "../../lib/membership-utils";
import { Prisma } from "../../../prisma/generated/browser";
import { use } from "react";

interface MembershipStatusCardProps {
    membershipProductPromise: Promise<Prisma.ProductGetPayload<{ select: { name: true } }> | null>;
}

const MembershipStatusCard = ({ membershipProductPromise }: MembershipStatusCardProps) => {
    const theme = useTheme();
    const { user, language } = useUserContext();
    const { state: membershipState, daysLeft } = useMembershipState();
    const hasActiveMembership =
        membershipState === MembershipState.active ||
        membershipState === MembershipState.expiringSoon;
    const membershipProduct = use(membershipProductPromise);

    if (!user) throw new Error("User must be logged in to view membership status");

    const getChipProps = (): Pick<ChipProps, "icon" | "label" | "color"> => {
        switch (membershipState) {
            case MembershipState.active:
                return {
                    icon: <CheckCircle />,
                    label: LanguageTranslations.active[language],
                    color: "success",
                };
            case MembershipState.expiringSoon:
                return {
                    icon: <Schedule />,
                    label: LanguageTranslations.expiresInDaysChip[language](daysLeft ?? 0),
                    color: "warning",
                };
            case MembershipState.awaitingValidation:
                return {
                    icon: <HourglassTop />,
                    label: LanguageTranslations.pending[language],
                    color: "info",
                };
            case MembershipState.awaitingPayment:
                return {
                    icon: <Payments />,
                    label: LanguageTranslations.awaitingPayment[language],
                    color: "info",
                };
            default:
                return {
                    icon: <Warning />,
                    label: LanguageTranslations.expired[language],
                    color: "error",
                };
        }
    };

    // Pending states are neutral news, not a rejection: never paint them red.
    const isPendingState =
        membershipState === MembershipState.awaitingValidation ||
        membershipState === MembershipState.awaitingPayment;
    const promptPalette = isPendingState ? theme.palette.info : theme.palette.error;
    const promptText =
        membershipState === MembershipState.awaitingValidation
            ? LanguageTranslations.membershipPendingPrompt[language]
            : LanguageTranslations.membershipExpiredPrompt[language](membershipState);

    return (
        <Card elevation={3}>
            <CardContent>
                <Stack spacing={3}>
                    {/* Header */}
                    <Stack
                        direction="row"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {LanguageTranslations.membership[language]}
                        </Typography>
                        <Chip {...getChipProps()} size="small" />
                    </Stack>

                    <Divider />

                    {/* Membership Info */}
                    {!hasActiveMembership ? (
                        <Stack
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: promptPalette.light + "20",
                                border: `1px solid ${promptPalette.light}`,
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    color: promptPalette.main,
                                    fontWeight: 500,
                                    textAlign: "center",
                                }}
                            >
                                {promptText}
                            </Typography>
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            {/* Member Since */}
                            <Stack
                                direction="row"
                                spacing={2}
                                sx={{
                                    alignItems: "center",
                                }}
                            >
                                <Person color="primary" />
                                <Stack>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                        }}
                                    >
                                        {LanguageTranslations.memberSince[language]}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {formatUtcDateToTimezone(user.created_at)}
                                    </Typography>
                                </Stack>
                            </Stack>

                            {/* Membership type */}
                            {membershipProduct && (
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    sx={{
                                        alignItems: "center",
                                    }}
                                >
                                    <CardMembership color="primary" />
                                    <Stack>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                            }}
                                        >
                                            {LanguageTranslations.membership[language]}
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {membershipProduct.name}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            )}

                            {/* Expiration Date */}
                            {user.user_membership && (
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    sx={{
                                        alignItems: "center",
                                    }}
                                >
                                    <Schedule color="primary" />
                                    <Stack>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                            }}
                                        >
                                            {LanguageTranslations.membershipExpires[language]}
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {formatUtcDateToTimezone(
                                                dayjs.utc(user.user_membership.expires_at),
                                            )}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            )}

                            <Stack
                                direction="row"
                                spacing={2}
                                sx={{
                                    alignItems: "center",
                                }}
                            >
                                <AdminPanelSettings color="primary" />
                                <Stack>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                        }}
                                    >
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
