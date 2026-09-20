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
import { Prisma } from "../../../prisma/generated/browser";
import { Language } from "../../../prisma/generated/enums";
import { use } from "react";
import { useMembershipState } from "../../lib/use-membership-state";
import MembershipStepper from "../../ui/MembershipStepper";
import {
    isMembershipActive,
    MembershipState,
    MembershipStateType,
} from "../../lib/membership-utils";

type StatusChip = { icon: ChipProps["icon"]; label: string; color: ChipProps["color"] };

const getStatusChip = (
    state: MembershipStateType,
    daysLeft: number,
    language: Language,
): StatusChip => {
    switch (state) {
        case MembershipState.expiringSoon:
            return {
                icon: <Schedule />,
                label: LanguageTranslations.expiresInDays[language](daysLeft),
                color: "warning",
            };
        case MembershipState.active:
            return {
                icon: <CheckCircle />,
                label: LanguageTranslations.active[language],
                color: "success",
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
            // expired, blacklisted
            return {
                icon: <Warning />,
                label: LanguageTranslations.expired[language],
                color: "error",
            };
    }
};

const getInactivePrompt = (state: MembershipStateType, language: Language): string => {
    switch (state) {
        case MembershipState.awaitingValidation:
            return LanguageTranslations.membershipPendingPrompt[language];
        case MembershipState.awaitingPayment:
            return LanguageTranslations.membershipActivatePrompt[language];
        default:
            return LanguageTranslations.membershipExpiredPrompt[language];
    }
};

interface MembershipStatusCardProps {
    membershipProductPromise: Promise<Prisma.ProductGetPayload<{ select: { name: true } }> | null>;
}

const MembershipStatusCard = ({ membershipProductPromise }: MembershipStatusCardProps) => {
    const theme = useTheme();
    const { language } = useUserContext();
    const { state, daysLeft, user } = useMembershipState();
    const membershipProduct = use(membershipProductPromise);

    if (!user) throw new Error("User must be logged in to view membership status");

    const isActive = isMembershipActive(state);
    const chip = getStatusChip(state, daysLeft ?? 0, language);
    // Pending and awaiting payment are informational, not failures. Only a lapse is an error.
    const prompt = getInactivePrompt(state, language);
    const promptPalette =
        state === MembershipState.awaitingValidation || state === MembershipState.awaitingPayment
            ? theme.palette.info
            : theme.palette.error;
    // Applicants mid-process see where they are. Active and lapsed members do not need onboarding.
    const processStep =
        state === MembershipState.awaitingValidation
            ? 1
            : state === MembershipState.awaitingPayment
              ? 2
              : null;

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
                        <Chip icon={chip.icon} label={chip.label} color={chip.color} size="small" />
                    </Stack>

                    <Divider />

                    {/* Membership Info */}
                    {!isActive ? (
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
                                {prompt}
                            </Typography>
                            {processStep !== null && <MembershipStepper activeStep={processStep} />}
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
