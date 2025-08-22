import { CircularProgress, Typography } from "@mui/material";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const ErrorBoundarySuspense = ({ errorMessage = "An unexpected error occurred", children }) => {
    return (
        <ErrorBoundary fallback={<Typography>{errorMessage}</Typography>}>
            <Suspense fallback={<CircularProgress />}>{children}</Suspense>
        </ErrorBoundary>
    );
};

export default ErrorBoundarySuspense;
