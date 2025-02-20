import {
    Button,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
} from "@mui/material";
import Image from "next/image";
import { redirect } from "next/navigation";
import { OrgSettings } from "../lib/org-settings";
import GlobalConstants from "../GlobalConstants";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { SwishConstants } from "../lib/swish-constants";
import { isMembershipExpired } from "../lib/definitions";
import { useUserContext } from "../context/UserContext";

interface IRenewMembership {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const RenewMembership = ({ open, setOpen }: IRenewMembership) => {
    const { user, updateLoggedInUser } = useUserContext();
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [paymentStatus, setPaymentStatus] = useState(SwishConstants.PENDING);
    const intervalIdRef = useRef(null);

    const closeQrCodeDialog = () => {
        clearInterval(intervalIdRef.current);
        URL.revokeObjectURL(qrCodeUrl);
        setPaymentStatus(SwishConstants.PENDING);
        setOpen(false);
    };

    const simulateSwishPayment = async () => {
        // Simulate response from swish
        const examplePaymentConf = {
            id: "0902D12C7FAE43D3AAAC49622AA79FEF",
            payeePaymentReference: "0123456789",
            paymentReference: "652ED6A2BCDE4BA8AD11D7334E9567B7",
            callbackUrl: SwishConstants.CALLBACK_URL,
            payerAlias: "46712347689",
            payeeAlias: "1234679304",
            amount: 100.0,
            currency: "SEK",
            message: "8a08c6e2-bbc9-41b6-9a51-0f989559f8f1", // kellen3 user id
            status: "PAID",
            dateCreated: "2022-04-13T09:05:32.717Z",
            datePaid: dayjs().toISOString(),
            errorCode: null,
            errorMessage: null,
        };
        await axios.post(SwishConstants.CALLBACK_URL, examplePaymentConf);
    };

    const handleMobilePaymentFlow = async () => {
        try {
            const paymentRequestResponse = await axios.get(
                `${OrgSettings[GlobalConstants.BASE_URL]}/api/swish`,
            );
            if (paymentRequestResponse.data) {
                const paymentRequest = paymentRequestResponse.data;
                const appUrl = `swish://paymentrequest?token=${paymentRequest.token}&callbackurl=${SwishConstants.CALLBACK_URL}`;
                // Open or redirect the user to the url
                redirect(appUrl);
            }
        } catch {
            setPaymentStatus(SwishConstants.ERROR);
        }
    };

    /**
     * Wait for payment for 5 minutes
     * Update user every 5 seconds. If membership is valid, stop waiting.
     */
    const waitForMembershipRenewal = async () => {
        const startTime = dayjs();
        const waitTime = 5 * 60; // s
        intervalIdRef.current = setInterval(async () => {
            if (dayjs().isAfter(startTime.add(waitTime, "s"))) {
                clearInterval(intervalIdRef.current);
                setPaymentStatus(SwishConstants.EXPIRED);
            }
            const updatedUser = await updateLoggedInUser();
            if (!isMembershipExpired(updatedUser)) {
                clearInterval(intervalIdRef.current);
                setPaymentStatus(SwishConstants.PAID);
            }
        }, 10000);
    };

    const handleDesktopPaymentFlow = async () => {
        try {
            const createdPaymentRequestResponse = await axios.get(
                `${OrgSettings[GlobalConstants.BASE_URL]}/api/swish?${GlobalConstants.ID}=${user[GlobalConstants.ID]}`,
                {
                    responseType: "arraybuffer",
                },
            );

            if (createdPaymentRequestResponse.status === 200) {
                const qrCodeBlob = new Blob([createdPaymentRequestResponse.data], {
                    type: "image/png",
                });
                const url = URL.createObjectURL(qrCodeBlob);
                setQrCodeUrl(url);
            }
        } catch {
            setPaymentStatus(SwishConstants.ERROR);
        }
    };

    const startPaymentProcess = async () => {
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            await handleMobilePaymentFlow();
        } else {
            await handleDesktopPaymentFlow();
            await waitForMembershipRenewal();
        }
    };

    const getPaymentStatusMsg = () => {
        switch (paymentStatus) {
            case SwishConstants.PENDING:
                return qrCodeUrl ? "Awaiting your payment..." : "";
            case SwishConstants.PAID:
                return "Thank you for your payment! Your membership has been renewed";
            case SwishConstants.EXPIRED:
                return "Your payment request expired";
            default: {
                return "Something went wrong...";
            }
        }
    };

    return (
        <Dialog open={open} onClose={closeQrCodeDialog}>
            <DialogTitle>Renew membership</DialogTitle>
            <DialogContent>
                {qrCodeUrl ? (
                    <Stack>
                        <DialogContentText>
                            {`Scan the QR code to pay your membership fee of ${OrgSettings[GlobalConstants.MEMBERSHIP_FEE]} SEK`}
                        </DialogContentText>

                        <Image
                            alt="swish qr code"
                            src={qrCodeUrl}
                            width={OrgSettings[GlobalConstants.SWISH_QR_CODE_SIZE] as number}
                            height={OrgSettings[GlobalConstants.SWISH_QR_CODE_SIZE] as number}
                        />
                        {/* TODO: Remove payment simulation in production */}
                        <Button onClick={simulateSwishPayment}>simulate pay</Button>
                    </Stack>
                ) : (
                    <Button onClick={startPaymentProcess}>start swish payment process</Button>
                )}

                <DialogContentText>{getPaymentStatusMsg()}</DialogContentText>
            </DialogContent>
        </Dialog>
    );
};

export default RenewMembership;
