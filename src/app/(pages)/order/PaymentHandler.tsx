"use client";
import { Button, Stack, Checkbox, Typography, Link } from "@mui/material";
import React, { use, useState } from "react";
import { redirectToOrderPayment } from "../../lib/payment-actions";
import { useNotificationContext } from "../../context/NotificationContext";
import { allowRedirectException, getPrivacyPolicyUrl, getTermsOfPurchaseUrl } from "../../ui/utils";
import ConfirmButton from "../../ui/ConfirmButton";
import { cancelOrder } from "../../lib/order-actions";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { OrderStatus } from "../../../prisma/generated/enums";
import { Prisma } from "../../../prisma/generated/browser";

interface PaymentHandlerProps {
    orderPromise: Promise<
        Prisma.OrderGetPayload<{
            include: { order_items: { include: { product: { include: { membership: true } } } } };
        }>
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

    const redirectToOrderPaymentAction = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!termsAccepted.termsOfPurchase || !termsAccepted.privacyPolicy) {
            addNotification(LanguageTranslations.termsRequired[language], "error");
            return;
        }
        try {
            const errorMsg = await redirectToOrderPayment(order.id);
            if (errorMsg) addNotification(errorMsg, "error");
        } catch (error) {
            allowRedirectException(error);
            // Show notification for all other errors
            addNotification(LanguageTranslations.failedPaymentRedirect[language], "error");
        }
    };

    const cancelOrderAction = async () => {
        try {
            await cancelOrder(order.id);
            addNotification(LanguageTranslations.cancelledOrder[language], "success");
        } catch {
            addNotification(LanguageTranslations.cancelledOrder[language], "error");
        }
    };

    return (
        order?.status === OrderStatus.pending && (
            <Stack component="form" onSubmit={redirectToOrderPaymentAction}>
                <Stack alignItems="center" width="100%">
                    <Stack direction="row" alignItems={"center"} width={"100%"}>
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
                                href={
                                    getTermsOfPurchaseUrl(organizationSettings, language) as string
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {LanguageTranslations.termsOfPurchase[language]}
                            </Link>
                        </Typography>
                    </Stack>
                    <Stack direction="row" alignItems={"center"} width={"100%"}>
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
                                href={getPrivacyPolicyUrl(organizationSettings, language) as string}
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
                    <ConfirmButton
                        buttonProps={{
                            fullWidth: true,
                            color: "error",
                        }}
                        onClick={cancelOrderAction}
                    >
                        {GlobalLanguageTranslations.cancel[language]}
                    </ConfirmButton>
                </Stack>
            </Stack>
        )
    );
};

export default PaymentHandler;
