"use server";

import { CircularProgress, Typography } from "@mui/material";
import { getAllUsers } from "../../lib/user-actions";
import GlobalConstants from "../../GlobalConstants";
import { unstable_cache } from "next/cache";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import MembersDashboard from "./MembersDashboard";

const MembersPage = async () => {
    const membersPromise = unstable_cache(getAllUsers, [], {
        tags: [GlobalConstants.USER],
    })();

    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <ErrorBoundary fallback={<Typography color="primary">Failed to load users</Typography>}>
            <Suspense fallback={<CircularProgress />}>
                <MembersDashboard membersPromise={membersPromise} />
            </Suspense>
        </ErrorBoundary>
    );
};

export default MembersPage;
