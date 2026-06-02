import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import Dashboard from "./Dashboard";
import dayjs from "dayjs";

const getCachedUserEventParticipants = async (userId: string) => {
    return await prisma.eventParticipant.findMany({
        where: {
            user_id: userId,
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
    const loggedInUser = await getLoggedInUser();
    const ticketInfoPromise = loggedInUser
        ? getCachedUserEventParticipants(loggedInUser.id)
        : Promise.reject(new Error("Unauthorized"));

    return <Dashboard ticketInfoPromise={ticketInfoPromise} />;
};

export default DashboardPage;
