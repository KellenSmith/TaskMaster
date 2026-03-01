"use client";

import { Error } from "@mui/icons-material";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { allowRedirectException } from "./utils";
import { useUserContext } from "../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";

const Container = ({ children }: { children: React.ReactNode }) => (
    <Stack direction="row" height="100%" width="100%" justifyContent="center" alignItems="center">
        {children}
    </Stack>
);

export const ErrorFallback = () => {
    const { language } = useUserContext();
    return (
        <Container>
            <Error />
            <Typography variant="h6" sx={{ marginLeft: 1 }}>
                {LanguageTranslations.unexpectedError[language]}
            </Typography>
        </Container>
    );
};

export const LoadingFallback = () => {
    return (
        <Container>
            <CircularProgress color="primary" />
        </Container>
    );
};

const ErrorBoundarySuspense = ({ children }: { children: React.ReactNode }) => {
    return (
        <ErrorBoundary
            fallbackRender={({ error }) => {
                console.error(error);
                allowRedirectException(error);
                return <ErrorFallback />;
            }}
        >
            <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
        </ErrorBoundary>
    );
};

export default ErrorBoundarySuspense;
