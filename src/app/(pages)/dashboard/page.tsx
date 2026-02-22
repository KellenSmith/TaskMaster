import dayjs from "dayjs";
import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-actions";
import Dashboard from "./Dashboard";
import { serverRedirect } from "../../lib/utils";
import GlobalConstants from "../../GlobalConstants";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const DashboardPage = async () => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) serverRedirect([GlobalConstants.LOGIN]);

    const ticketInfoPromise = prisma.eventParticipant.findMany({
        where: {
            user_id: loggedInUser!.id,
            ticket: {
                event: {
                    end_time: {
                        lt: dayjs.utc().add(1, "day").toDate(), // Only get tickets for events that haven't ended yet
                    },
                },
            },
        },
        include: {
            ticket: {
                include: {
                    event: {
                        select: {
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

    return (
        <ErrorBoundarySuspense>
            <Dashboard ticketInfoPromise={ticketInfoPromise} />
        </ErrorBoundarySuspense>
    );
};

export default DashboardPage;
