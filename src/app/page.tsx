import React from "react";
import ErrorBoundarySuspense from "./ui/ErrorBoundarySuspense";
import HomeDashboard from "./HomeDashboard";
import { getTextContent } from "./lib/text-content-actions";
import { getLoggedInUser } from "./lib/user-actions";
import { prisma } from "../prisma/prisma-client";
import dayjs from "dayjs";
import { Prisma } from "../prisma/generated/client";

export type TicketInfoType = Promise<Prisma.EventParticipantGetPayload<{ include: { ticket: { include: { event: { select: { title: true, start_time: true, end_time: true, location: { select: { name: true } } } } }, user: { select: { id: true, nickname: true } } } } }>[]>

const HomePage: React.FC = async () => {
    const textContentPromise = getTextContent("home");
    const loggedInUser = await getLoggedInUser()


    let ticketInfoPromise: null | TicketInfoType = null;
    if (loggedInUser)
        ticketInfoPromise = prisma.eventParticipant.findMany({
            where: {
                user_id: loggedInUser.id,
                ticket: {
                    event: {
                        end_time: {
                            lt: dayjs().add(1, "day").toDate(), // Only get tickets for events that haven't ended yet
                        }
                    }
                }
            },
            include: {
                ticket: {
                    include: {
                        event: {
                            select: { title: true, start_time: true, end_time: true, location: { select: { name: true } } },
                        },
                    },
                },
            },
            orderBy: {
                ticket: {
                    event: {
                        start_time: "asc",
                    }
                }
            }
        })

    return (
        <ErrorBoundarySuspense>
            <HomeDashboard textContentPromise={textContentPromise} ticketInfoPromise={ticketInfoPromise} />
        </ErrorBoundarySuspense>
    );
};

export default HomePage;
