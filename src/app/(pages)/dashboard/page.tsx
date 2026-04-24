import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import Dashboard from "./Dashboard";
import { serverRedirect } from "../../lib/utils";
import GlobalConstants from "../../GlobalConstants";
import dayjs from "../../lib/dayjs";

const DashboardPage = async () => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) serverRedirect([GlobalConstants.LOGIN]);

    const ticketInfoPromise = prisma.eventParticipant.findMany({
        where: {
            user_id: loggedInUser!.id,
            ticket: {
                event: {
                    end_time: {
                        gt: dayjs().toDate(), // Only get tickets for events that haven't ended yet
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

    return <Dashboard ticketInfoPromise={ticketInfoPromise} />;
};

export default DashboardPage;
