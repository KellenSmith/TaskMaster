"use client";
import {
    Button,
    Stack,
    Checkbox,
    Typography,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Card,
} from "@mui/material";
import React, { use, useState } from "react";
import { redirectToOrderPayment } from "../../lib/payment-actions";
import { useNotificationContext } from "../../context/NotificationContext";
import { allowRedirectException, getPrivacyPolicyUrl, getTermsOfPurchaseUrl } from "../../ui/utils";
import ConfirmButton from "../../ui/ConfirmButton";
import { cancelOrder, markAsPaid, userConfirmOrderPayment } from "../../lib/order-actions";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { OrderStatus } from "../../../prisma/generated/enums";
import { Prisma } from "../../../prisma/generated/browser";
import { isUserAdmin } from "../../lib/utils";
import { useRouter } from "next/navigation";
import RichTextField from "../../ui/form/RichTextField";

interface PaymentHandlerProps {
    orderPromise: Promise<
        Prisma.OrderGetPayload<{
            include: { order_items: { include: { product: { include: { membership: true } } } } };
        }>
    >;
}

const PaymentHandler = ({ orderPromise }: PaymentHandlerProps) => {
    const { language, user } = useUserContext();
    const { organizationSettings, handlePaymentsManually } = useOrganizationSettingsContext();
    const { addNotification } = useNotificationContext();
    const order = use(orderPromise);
    const [termsAccepted, setTermsAccepted] = useState({
        termsOfPurchase: false,
        privacyPolicy: false,
    });
    const [paymentInfoOpen, setPaymentInfoOpen] = useState(false);
    const router = useRouter();

    const redirectToOrderPaymentAction = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!termsAccepted.termsOfPurchase || !termsAccepted.privacyPolicy) {
            addNotification(LanguageTranslations.termsRequired[language], "error");
            return;
        }
        try {
            const errorMsg = await redirectToOrderPayment(order.id);
            if (errorMsg) {
                addNotification(errorMsg, "error");
                router.refresh();
            }
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
            router.refresh();
        } catch {
            addNotification(LanguageTranslations.failedCancelOrder[language], "error");
        }
    };

    const userConfirmOrderPaymentAction = async () => {
        try {
            await userConfirmOrderPayment(order.id);
            addNotification(LanguageTranslations.confirmedPayment[language], "success");
            setPaymentInfoOpen(false);
            router.refresh();
        } catch {
            addNotification(LanguageTranslations.failedConfirmPayment[language], "error");
        }
    };

    const markAsPaidAction = async () => {
        try {
            await markAsPaid(order.id);
            addNotification(LanguageTranslations.markedAsPaid[language], "success");
            router.refresh();
        } catch {
            addNotification(LanguageTranslations.failedMarkAsPaid[language], "error");
        }
    };

    return (
        (order?.status === OrderStatus.pending ||
            order?.status === OrderStatus.payment_confirmed) && (
            <>
                <Stack
                    component="form"
                    onSubmit={
                        handlePaymentsManually
                            ? (event) => {
                                  event.preventDefault();
                                  setPaymentInfoOpen(true);
                              }
                            : redirectToOrderPaymentAction
                    }
                >
                    <Stack
                        sx={{
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        {order?.status === OrderStatus.pending && (
                            <>
                                <Stack
                                    direction="row"
                                    sx={{
                                        alignItems: "center",
                                        width: "100%",
                                    }}
                                >
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
                                                getTermsOfPurchaseUrl(
                                                    organizationSettings,
                                                    language,
                                                ) as string
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {LanguageTranslations.termsOfPurchase[language]}
                                        </Link>
                                    </Typography>
                                </Stack>
                                <Stack
                                    direction="row"
                                    sx={{
                                        alignItems: "center",
                                        width: "100%",
                                    }}
                                >
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
                                            href={
                                                getPrivacyPolicyUrl(
                                                    organizationSettings,
                                                    language,
                                                ) as string
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {LanguageTranslations.privacyPolicy[language]}
                                        </Link>
                                    </Typography>
                                </Stack>
                            </>
                        )}

                        {order.status === OrderStatus.pending && (
                            <Button
                                type="submit"
                                color="success"
                                fullWidth
                                disabled={
                                    !(termsAccepted.termsOfPurchase && termsAccepted.privacyPolicy)
                                }
                            >
                                {LanguageTranslations.pay[language](order.total_amount)}
                            </Button>
                        )}
                        {handlePaymentsManually &&
                            order.status === OrderStatus.payment_confirmed &&
                            isUserAdmin(user) && (
                                <ConfirmButton
                                    buttonProps={{
                                        fullWidth: true,
                                        color: "success",
                                    }}
                                    onClick={markAsPaidAction}
                                    confirmText={
                                        LanguageTranslations.areYouSureMarkAsPaid[language]
                                    }
                                >
                                    {LanguageTranslations.markAsPaid[language]}
                                </ConfirmButton>
                            )}
                        {order.status === OrderStatus.pending && (
                            <ConfirmButton
                                buttonProps={{
                                    fullWidth: true,
                                    color: "error",
                                }}
                                onClick={cancelOrderAction}
                            >
                                {GlobalLanguageTranslations.cancel[language]}
                            </ConfirmButton>
                        )}
                    </Stack>
                </Stack>
                <Dialog open={paymentInfoOpen}>
                    <DialogTitle>{LanguageTranslations.paymentInfo[language]}</DialogTitle>
                    <DialogContent>
                        <DialogContentText
                            {...(organizationSettings.payment_instructions && {
                                sx: { paddingBottom: 2 },
                            })}
                        >
                            {organizationSettings.payment_instructions &&
                                `${LanguageTranslations.followPaymentInstructions[language]} `}
                            {LanguageTranslations.yourOrderWillBeProcessed[language]}
                        </DialogContentText>
                        {organizationSettings.payment_instructions && (
                            <RichTextField
                                editMode={false}
                                defaultValue={organizationSettings.payment_instructions}
                            />
                        )}
                        <Button color="success" fullWidth onClick={userConfirmOrderPaymentAction}>
                            {LanguageTranslations.confirmPayment[language]}
                        </Button>
                        <Button color="error" fullWidth onClick={() => setPaymentInfoOpen(false)}>
                            {GlobalLanguageTranslations.cancel[language]}
                        </Button>
                    </DialogContent>
                </Dialog>
            </>
        )
    );
};

export default PaymentHandler;
