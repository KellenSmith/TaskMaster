import { Error } from "@mui/icons-material";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const Container = ({ children }) => (
    <Stack height="100%" width="100%" justifyContent="center" alignItems="center">
        {children}
    </Stack>
);

export const ErrorFallback = () => {
    return (
        <Container>
            <Error />
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

const ErrorBoundarySuspense = ({ children }) => {
    return (
        <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
        </ErrorBoundary>
    );
};

export default ErrorBoundarySuspense;
