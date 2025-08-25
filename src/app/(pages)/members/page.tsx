"use server";

import { getAllUsers } from "../../lib/user-actions";
import GlobalConstants from "../../GlobalConstants";
import { unstable_cache } from "next/cache";
import MembersDashboard from "./MembersDashboard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const MembersPage = async () => {
    const membersPromise = unstable_cache(getAllUsers, [], {
        tags: [GlobalConstants.USER],
    })();

    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <ErrorBoundarySuspense errorMessage="Failed to load users">
            <MembersDashboard membersPromise={membersPromise} />
        </ErrorBoundarySuspense>
    );
};

export default MembersPage;
