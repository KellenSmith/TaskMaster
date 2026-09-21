"use client";

import { Box, Step, StepLabel, Stepper, Typography, useMediaQuery, useTheme } from "@mui/material";
import { StepIconProps } from "@mui/material/StepIcon";
import { Celebration, Check, HowToReg, Payments, PendingActions } from "@mui/icons-material";
import { FC, use } from "react";
import { Language } from "../../prisma/generated/enums";
import { useUserContext } from "../context/UserContext";
import {
    MembershipProduct,
    useMembershipProductsContext,
} from "../context/MembershipProductsContext";
import LanguageTranslations from "../lib/membership-language-translations";
import { formatPrice } from "./utils";

export const MEMBERSHIP_STEPS = ["apply", "review", "pay", "active"] as const;
export type MembershipStep = (typeof MEMBERSHIP_STEPS)[number];

const STEP_ICONS = [HowToReg, PendingActions, Payments, Celebration];

const MembershipStepIcon = ({ active, completed, icon }: StepIconProps) => {
    const theme = useTheme();
    const Icon = completed ? Check : STEP_ICONS[Number(icon) - 1];
    const ring = completed
        ? theme.palette.success.main
        : active
          ? theme.palette.primary.main
          : theme.palette.divider;
    return (
        <Box
            data-testid={completed ? "step-completed" : active ? "step-active" : "step-upcoming"}
            sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${ring}`,
                bgcolor: active ? theme.palette.primary.main : "transparent",
                color: completed
                    ? theme.palette.success.main
                    : active
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.disabled,
            }}
        >
            <Icon fontSize="small" />
        </Box>
    );
};

/**
 * Label and hint for the "pay" step, derived from what the organization actually
 * offers so the stepper never promises a fee that does not exist or hides one that does.
 */
export const getPayStepCopy = (
    products: MembershipProduct[],
    language: Language,
): { label: string; hint: string } => {
    const t = LanguageTranslations.steps.pay;
    if (products.length === 0)
        return { label: t.activateLabel[language], hint: t.hintUnknown[language] };

    const allFree = products.every((m) => m.product.price === 0);
    if (allFree) return { label: t.activateLabel[language], hint: t.hintFree[language] };

    if (products.length === 1) {
        const [only] = products;
        return {
            label: t.payLabel[language],
            hint: t.hintSingle[language](formatPrice(only.product.price), only.duration),
        };
    }

    const options = products.map((m) =>
        m.product.price === 0
            ? `${m.product.name} (${t.free[language]})`
            : `${m.product.name} ${formatPrice(m.product.price)} SEK`,
    );
    return { label: t.payLabel[language], hint: t.hintChoice[language](options) };
};

interface MembershipStepperProps {
    /** 0 apply, 1 review, 2 pay, 3 active. Callers must not render this for lapsed members. */
    activeStep: number;
}

/**
 * The four-step membership process: apply, review, pay, active. Shown to
 * applicants and not-yet-active members so they always know where they are.
 * Suspends on the membership products promise; mount inside a Suspense boundary.
 */
const MembershipStepper: FC<MembershipStepperProps> = ({ activeStep }) => {
    const { language } = useUserContext();
    const { membershipProductsPromise } = useMembershipProductsContext();
    const products = use(membershipProductsPromise);
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

    const payCopy = getPayStepCopy(products, language);
    const copyFor = (step: MembershipStep) =>
        step === "pay"
            ? payCopy
            : {
                  label: LanguageTranslations.steps[step].label[language],
                  hint: LanguageTranslations.steps[step].hint[language],
              };

    return (
        <Stepper
            activeStep={activeStep}
            alternativeLabel={!isSmall}
            orientation={isSmall ? "vertical" : "horizontal"}
            sx={{ width: "100%", py: 2 }}
        >
            {MEMBERSHIP_STEPS.map((step) => {
                const { label, hint } = copyFor(step);
                return (
                    <Step key={step}>
                        <StepLabel slots={{ stepIcon: MembershipStepIcon }}>
                            <Typography variant="subtitle2">{label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {hint}
                            </Typography>
                        </StepLabel>
                    </Step>
                );
            })}
        </Stepper>
    );
};

export default MembershipStepper;
