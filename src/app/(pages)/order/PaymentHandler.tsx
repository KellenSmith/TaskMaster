"use client";
import { Button, Stack, Checkbox, Typography, Link } from "@mui/material";
import React, { use, useState } from "react";
import { redirectToSwedbankPayment } from "../../lib/payment-actions";
import { OrderStatus, Prisma } from "@prisma/client";
import { useNotificationContext } from "../../context/NotificationContext";
import { allowRedirectException, getPrivacyPolicyUrl, getTermsOfPurchaseUrl } from "../../ui/utils";
import ConfirmButton from "../../ui/ConfirmButton";
import { progressOrder } from "../../lib/order-actions";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";

interface PaymentHandlerProps {
    orderPromise: Promise<
        Prisma.OrderGetPayload<{ include: { order_items: { include: { product: true } } } }>
    >;
}

const PaymentHandler = ({ orderPromise }: PaymentHandlerProps) => {
    const { language } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    const { addNotification } = useNotificationContext();
    const order = use(orderPromise);
    const [termsAccepted, setTermsAccepted] = useState({
        termsOfPurchase: false,
        privacyPolicy: false,
    });

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!termsAccepted.termsOfPurchase || !termsAccepted.privacyPolicy) {
            addNotification(LanguageTranslations.termsRequired[language], "error");
            return;
        }
        await redirectToPayment();
    };

    const redirectToPayment = async () => {
        try {
            await redirectToSwedbankPayment(order.id);
        } catch (error) {
            allowRedirectException(error);
            // Show notification for all other errors
            addNotification(LanguageTranslations.failedPaymentRedirect[language], "error");
        }
    };

    const cancelOrder = async () => {
        try {
            await progressOrder(order.id, OrderStatus.cancelled);
            addNotification(LanguageTranslations.cancelledOrder[language], "success");
        } catch {
            addNotification(LanguageTranslations.cancelledOrder[language], "error");
        }
    };

    return (
        order.status === OrderStatus.pending && (
            <Stack component="form" onSubmit={handleSubmit}>
                <Stack alignItems="center" width="100%">
                    <Stack direction="row" alignItems={"center"}>
                        <Checkbox
                            checked={termsAccepted.termsOfPurchase}
                            onChange={(e) =>
                                setTermsAccepted({
                                    ...termsAccepted,
                                    termsOfPurchase: e.target.checked,
                                })
                            }
                            required
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                display: "inline",
                                wordBreak: "keep-all",
                                hyphens: "none",
                                marginRight: 1,
                            }}
                        >
                            {LanguageTranslations.iHaveRead[language]}{" "}
                            <Link
                                href={getTermsOfPurchaseUrl(organizationSettings, language)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {LanguageTranslations.termsOfPurchase[language]}
                            </Link>
                        </Typography>
                    </Stack>
                    <Stack direction="row" alignItems={"center"}>
                        <Checkbox
                            checked={termsAccepted.privacyPolicy}
                            onChange={(e) =>
                                setTermsAccepted({
                                    ...termsAccepted,
                                    privacyPolicy: e.target.checked,
                                })
                            }
                            required
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                display: "inline",
                                wordBreak: "keep-all",
                                hyphens: "none",
                                marginRight: 1,
                            }}
                        >
                            {LanguageTranslations.iHaveRead[language]}{" "}
                            <Link
                                href={getPrivacyPolicyUrl(organizationSettings, language)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {LanguageTranslations.privacyPolicy[language]}
                            </Link>
                        </Typography>
                    </Stack>

                    <Button
                        type="submit"
                        color="success"
                        fullWidth
                        disabled={!(termsAccepted.termsOfPurchase && termsAccepted.privacyPolicy)}
                    >
                        {LanguageTranslations.pay[language](order.total_amount)}
                    </Button>
                    <ConfirmButton fullWidth color="error" onClick={cancelOrder}>
                        {GlobalLanguageTranslations.cancel[language]}
                    </ConfirmButton>
                </Stack>
            </Stack>
        )
    );
};

export default PaymentHandler;
