import InfoDashboard from "./InfoDashboard";
import GlobalConstants from "../../GlobalConstants";
import { getCachedTextContent } from "../../lib/text-content-actions";
import { FC } from "react";
import { getLoggedInUser } from "../../lib/user-helpers";
import { userHasRolePrivileges } from "../../lib/auth/auth-utils";
import { prisma } from "../../../prisma/prisma-client";
import ProtectedPage from "../../ProtectedPage";

interface InfoPageProps {
    searchParams: Promise<{ [eventId: string]: string }>;
}

const getCachedInfoPageContentById = async (pageId: string) => {
    const infoPage = await prisma.infoPage.findUniqueOrThrow({
        where: { id: pageId },
        include: {
            titleText: { include: { translations: true } },
            content: true,
        },
    });
    if (!infoPage?.content) throw new Error("Info page content not found");

    const loggedInUser = await getLoggedInUser();
    if (!userHasRolePrivileges(loggedInUser, infoPage.lowest_allowed_user_role))
        throw new Error("Unauthorized");

    const textContentPromise = getCachedTextContent(infoPage.content.id);
    return textContentPromise;
};

const InfoPage: FC<InfoPageProps> = async ({ searchParams }) => {
    const pageId = (await searchParams)[GlobalConstants.INFO_PAGE_ID];

    const textContentPromise = getCachedInfoPageContentById(pageId);

    return (
        <ProtectedPage name={GlobalConstants.INFO_PAGE}>
            <InfoDashboard textContentPromise={textContentPromise} />
        </ProtectedPage>
    );
};

export default InfoPage;
