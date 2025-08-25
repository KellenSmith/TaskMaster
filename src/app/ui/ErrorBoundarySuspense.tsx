import { CircularProgress, Stack, Typography } from "@mui/material";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const Container = ({ children }) => (
    <Stack height="100%" width="100%" justifyContent="center" alignItems="center">
        {children}
    </Stack>
);

export const ErrorFallback = ({ errorMessage }) => {
    return (
        <Container>
            <Typography color="primary">{errorMessage}</Typography>
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

const ErrorBoundarySuspense = ({ errorMessage = "An unexpected error occurred", children }) => {
    return (
        <ErrorBoundary fallback={<ErrorFallback errorMessage={errorMessage} />}>
            <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
        </ErrorBoundary>
    );
};

export default ErrorBoundarySuspense;
