import { CircularProgress, Stack, Typography } from "@mui/material";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const ErrorBoundarySuspense = ({ errorMessage = "An unexpected error occurred", children }) => {
    const Container = ({ children }) => (
        <Stack height="100%" width="100%" justifyContent="center" alignItems="center">
            {children}
        </Stack>
    );

    const ErrorFallback = () => {
        return (
            <Container>
                <Typography color="primary">{errorMessage}</Typography>
            </Container>
        );
    };

    const LoadingFallback = () => {
        return (
            <Container>
                <CircularProgress color="primary" />
            </Container>
        );
    };

    return (
        <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
        </ErrorBoundary>
    );
};

export default ErrorBoundarySuspense;
