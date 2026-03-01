import InfoDashboard from "./InfoDashboard";
import GlobalConstants from "../../GlobalConstants";
import { getTextContent } from "../../lib/text-content-actions";
import { FC } from "react";
import { getLoggedInUser } from "../../lib/user-helpers";
import { userHasRolePrivileges } from "../../lib/auth/auth-utils";
import { prisma } from "../../../prisma/prisma-client";

interface InfoPageProps {
    searchParams: Promise<{ [eventId: string]: string }>;
}

const InfoPage: FC<InfoPageProps> = async ({ searchParams }) => {
    const pageId = (await searchParams)[GlobalConstants.INFO_PAGE_ID];

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

    const textContentPromise = getTextContent(infoPage.content.id);

    return <InfoDashboard textContentPromise={textContentPromise} id={infoPage.content.id} />;
};

export default InfoPage;
