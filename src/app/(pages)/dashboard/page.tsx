import { Prisma } from "../../../prisma/generated/client";
import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import Dashboard from "./Dashboard";
import dayjs from "dayjs";

const getCachedUserEventParticipants = async () => {
    const loggedInUser = await getLoggedInUser();

    if (!loggedInUser?.id) throw new Error("Unauthorized");

    return await prisma.eventParticipant.findMany({
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
        include: {
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
        },
        orderBy: {
            ticket: {
                event: {
                    start_time: "asc",
                },
            },
        },
    });
};

const DashboardPage = async () => {
    const ticketInfoPromise = getCachedUserEventParticipants();

    return <Dashboard ticketInfoPromise={ticketInfoPromise} />;
};

export default DashboardPage;
