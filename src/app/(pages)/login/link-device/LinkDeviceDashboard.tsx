"use client";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import GlobalConstants from "../../../GlobalConstants";
import { getRelativeUrl } from "../../../lib/utils";
import { useUserContext } from "../../../context/UserContext";
import { useNotificationContext } from "../../../context/NotificationContext";
import LanguageTranslations from "../LanguageTranslations";

type PairingRequest = {
    user_code: string;
    device_code: string;
};

type PollStatus = "pending" | "confirmed" | "expired" | "not_found";

const POLL_INTERVAL_MS = 2000;

const LinkDeviceDashboard: FC = () => {
    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [pairingRequest, setPairingRequest] = useState<PairingRequest | null>(null);
    const [expired, setExpired] = useState(false);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    const createPairingRequest = useCallback(async () => {
        stopPolling();
        setExpired(false);
        setPairingRequest(null);
        try {
            const response = await fetch(`/api/${GlobalConstants.DEVICE_PAIRING}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to create device pairing request");
            const data: PairingRequest = await response.json();
            setPairingRequest(data);
        } catch {
            addNotification(LanguageTranslations.codeExpiredRegenerate[language], "error");
        }
    }, [addNotification, language, stopPolling]);

    useEffect(() => {
        createPairingRequest();
        return stopPolling;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!pairingRequest) return;

        pollIntervalRef.current = setInterval(async () => {
            try {
                // device_code is a secret - send it in the request body, never in the URL,
                // so it isn't captured by platform/proxy request logging.
                const response = await fetch(
                    `/api/${GlobalConstants.DEVICE_PAIRING}/${GlobalConstants.STATUS}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ device_code: pairingRequest.device_code }),
                    },
                );
                const data: { status: PollStatus } = await response.json();

                if (data.status === "confirmed") {
                    stopPolling();
                    const result = await signIn(GlobalConstants.DEVICE_PAIRING, {
                        code: pairingRequest.device_code,
                        redirect: false,
                    });
                    if (result?.ok) {
                        // Full page navigation, not router.push: the root layout's
                        // server-fetched user session was established before sign-in
                        // completed, so a client-side navigation would render the
                        // dashboard with a stale, still-logged-out user.
                        window.location.href = getRelativeUrl([GlobalConstants.DASHBOARD]);
                    } else {
                        addNotification(LanguageTranslations.codeExpiredRegenerate[language], "error");
                        setExpired(true);
                    }
                } else if (data.status === "expired" || data.status === "not_found") {
                    stopPolling();
                    setExpired(true);
                }
            } catch {
                // Transient network errors are ignored, polling continues on the next tick
            }
        }, POLL_INTERVAL_MS);

        return stopPolling;
    }, [pairingRequest, addNotification, language, stopPolling]);

    if (expired) {
        return (
            <Stack spacing={2} sx={{ alignItems: "center" }}>
                <Typography>{LanguageTranslations.codeExpiredRegenerate[language]}</Typography>
                <Button onClick={createPairingRequest}>
                    {LanguageTranslations.regenerateCode[language]}
                </Button>
            </Stack>
        );
    }

    if (!pairingRequest) {
        return <CircularProgress />;
    }

    return (
        <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Typography>{LanguageTranslations.scanQrCodeInstruction[language]}</Typography>
            <img
                src={`/api/${GlobalConstants.DEVICE_PAIRING}/qrcode/${pairingRequest.user_code}`}
                alt="Device pairing QR code"
                width={300}
                height={300}
            />
            <Typography variant="h5">{pairingRequest.user_code}</Typography>
            <Typography color="text.secondary">
                {`${LanguageTranslations.orVisitApproveUrl[language]}: ${window.location.origin}${getRelativeUrl(
                    [GlobalConstants.LOGIN, GlobalConstants.APPROVE],
                )}`}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <CircularProgress size={16} />
                <Typography>{LanguageTranslations.waitingForApproval[language]}</Typography>
            </Stack>
        </Stack>
    );
};

export default LinkDeviceDashboard;
