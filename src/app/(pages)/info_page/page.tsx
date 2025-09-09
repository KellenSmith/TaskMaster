import { unstable_cache } from "next/cache";
import InfoDashboard from "./InfoDashboard";
import GlobalConstants from "../../GlobalConstants";
import { getTextContent } from "../../lib/text-content-actions";
import { FC } from "react";
import { getLoggedInUser } from "../../lib/user-actions";
import { getInfoPageById } from "../../lib/info-page-actions";
import { userHasRolePrivileges } from "../../lib/auth/auth-utils";
import ErrorBoundarySuspense, { ErrorFallback } from "../../ui/ErrorBoundarySuspense";

interface InfoPageProps {
    searchParams: Promise<{ [eventId: string]: string }>;
}

const InfoPage: FC<InfoPageProps> = async ({ searchParams }) => {
    const pageId = (await searchParams)[GlobalConstants.INFO_PAGE_ID];

    const loggedInUser = await getLoggedInUser();

    try {
        const infoPage = await getInfoPageById(pageId);
        if (!userHasRolePrivileges(loggedInUser, infoPage.lowest_allowed_user_role))
            throw new Error("Unauthorized");

        const textContentPromise = unstable_cache(getTextContent, [infoPage.content.id], {
            tags: [GlobalConstants.TEXT_CONTENT],
        })(infoPage.content.id);

        return (
            <ErrorBoundarySuspense>
                <InfoDashboard textContentPromise={textContentPromise} id={infoPage.content.id} />
            </ErrorBoundarySuspense>
        );
    } catch {
        return <ErrorFallback />;
    }
};

export default InfoPage;
