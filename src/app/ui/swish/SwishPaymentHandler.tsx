import {
    Button,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import GlobalConstants from "../../GlobalConstants";
import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { SwishConstants } from "../../lib/swish-constants";
import { useUserContext } from "../../context/UserContext";
import { apiEndpoints, makeApiRequest, navigateToRoute } from "../utils";
import { formatCurrency } from "../../lib/currency-utils";

interface ISwishPaymentHandler {
    title: string;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    hasPaid: () => Promise<boolean>;
    paymentAmount: number;
    callbackEndpoint: string;
    callbackParams?: any;
}

const SwishPaymentHandler = ({
    title,
    open,
    setOpen,
    hasPaid,
    paymentAmount,
    callbackEndpoint,
    callbackParams,
}: ISwishPaymentHandler) => {
    const { user } = useUserContext();
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [paymentStatus, setPaymentStatus] = useState(SwishConstants.PENDING);
    const router = useRouter();
    const callbackUrl = useMemo(() => {
        const url = new URL(callbackEndpoint, process.env.NEXT_PUBLIC_API_URL);
        if (callbackParams) url.search = callbackParams;
        return url.toString();
    }, [callbackEndpoint, callbackParams]);

    const closeQrCodeDialog = () => {
        setPaymentStatus(SwishConstants.PENDING);
        setOpen(false);
        setQrCodeUrl("");
        URL.revokeObjectURL(qrCodeUrl);
    };

    const simulatePaymentCallback = async () => {
        // Simulate response from swish
        const examplePaymentConf = {
            id: "0902D12C7FAE43D3AAAC49622AA79FEF",
            payeePaymentReference: "0123456789",
            paymentReference: "652ED6A2BCDE4BA8AD11D7334E9567B7",
            callbackUrl: callbackUrl,
            payerAlias: "46712347689",
            payeeAlias: "1234679304",
            amount: 100.0,
            currency: "SEK",
            message: user[GlobalConstants.ID],
            status: "PAID",
            dateCreated: "2022-04-13T09:05:32.717Z",
            datePaid: dayjs().toISOString(),
            errorCode: null,
            errorMessage: null,
        };
        await axios.post(callbackUrl, examplePaymentConf);
    };

    const handleMobilePaymentFlow = async () => {
        // TODO: Check that this works
        try {
            const paymentRequestResponse = await makeApiRequest({
                endpoint: apiEndpoints.PAYMENT_REQUEST_TOKEN,
                searchParams: [
                    [GlobalConstants.ID, user[GlobalConstants.ID]],
                    [SwishConstants.AMOUNT, paymentAmount],
                ],
            });
            if (paymentRequestResponse.data) {
                const paymentRequest = paymentRequestResponse.data;
                const appUrl = `swish://paymentrequest?token=${paymentRequest.token}&callbackurl=${callbackUrl}`;
                // Open or redirect the user to the url
                navigateToRoute(appUrl, router);
            }
        } catch {
            setPaymentStatus(SwishConstants.ERROR);
        }
    };

    const handleDesktopPaymentFlow = async () => {
        try {
            const swishQrCodeResponse = await makeApiRequest({
                endpoint: apiEndpoints.PAYMENT_REQUEST_QR_CODE,
                searchParams: [
                    [GlobalConstants.ID, user[GlobalConstants.ID]],
                    [SwishConstants.AMOUNT, paymentAmount],
                ],
                options: {
                    responseType: "arraybuffer",
                },
            });

            if (swishQrCodeResponse.status === 200) {
                const qrCodeBlob = new Blob([swishQrCodeResponse.data], {
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
        }
    };

    const finishPayment = async () => {
        if (await hasPaid()) {
            setPaymentStatus(SwishConstants.PAID);
            setQrCodeUrl("");
            URL.revokeObjectURL(qrCodeUrl);
        }
    };

    const getPaymentStatusMsg = () => {
        switch (paymentStatus) {
            case SwishConstants.PENDING:
                return qrCodeUrl ? "Awaiting your payment..." : "";
            case SwishConstants.PAID:
                return "Thank you for your payment!";
            case SwishConstants.EXPIRED:
                return "Your payment request expired";
            default: {
                return "Something went wrong...";
            }
        }
    };

    return (
        <Dialog open={open} onClose={closeQrCodeDialog}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {qrCodeUrl ? (
                    <Stack>
                        <DialogContentText>
                            {`Scan the QR code to pay ${formatCurrency(paymentAmount)}`}
                        </DialogContentText>

                        <Image
                            alt="swish qr code"
                            src={qrCodeUrl}
                            width={parseInt(process.env.NEXT_PUBLIC_SWISH_QR_CODE_SIZE)}
                            height={parseInt(process.env.NEXT_PUBLIC_SWISH_QR_CODE_SIZE)}
                        />
                        {/* TODO: Remove payment simulation in production */}
                        <Button onClick={simulatePaymentCallback}>simulate pay</Button>
                        <Button onClick={finishPayment}>finish</Button>
                    </Stack>
                ) : (
                    paymentStatus === SwishConstants.PENDING && (
                        <Button onClick={startPaymentProcess}>start swish payment process</Button>
                    )
                )}

                <DialogContentText>{getPaymentStatusMsg()}</DialogContentText>
            </DialogContent>
        </Dialog>
    );
};

export default SwishPaymentHandler;
