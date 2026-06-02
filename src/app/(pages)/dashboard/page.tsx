import { connection } from "next/server";
import type { Prisma } from "../../../prisma/generated/browser";
import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import Dashboard from "./Dashboard";
import dayjs from "dayjs";

const dashboardTicketInclude = {
    ticket: {
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    start_time: true,
                    end_time: true,
                    location: { select: { name: true } },
                },
            },
        },
    },
} satisfies Prisma.EventParticipantInclude;

type DashboardTicketInfo = Prisma.EventParticipantGetPayload<{
    include: typeof dashboardTicketInclude;
}>;

const getCachedUserEventParticipants = async (): Promise<DashboardTicketInfo[]> => {
    const loggedInUser = await getLoggedInUser();

    if (!loggedInUser?.id) throw new Error("Unauthorized");

    const participants = await prisma.eventParticipant.findMany({
        where: {
            user_id: loggedInUser.id,
            ticket: {
                event: {
                    end_time: {
                        gt: dayjs.utc().toDate(), // Only get tickets for events that haven't ended yet
                    },
                },
            },
        },
        include: dashboardTicketInclude,
        orderBy: {
            ticket: {
                event: {
                    start_time: "asc",
                },
            },
        },
    });

    return participants as DashboardTicketInfo[];
};

const DashboardPage = async () => {
    await connection();

    const ticketInfoPromise = getCachedUserEventParticipants();

    return <Dashboard ticketInfoPromise={ticketInfoPromise} />;
};

export default DashboardPage;
