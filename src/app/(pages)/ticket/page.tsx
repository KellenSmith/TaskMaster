import { cacheTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import { isMembershipExpired, isUserAdmin } from "../../lib/utils";
import TicketDashboard from "./TicketDashboard";
import { getUserEventParticipantsCacheTag } from "../../lib/event-participant-actions";

interface TicketPageProps {
    searchParams: Promise<{ [eventParticipantId: string]: string }>;
}

const getCachedEventParticipant = async (
    loggedInUserId: string,
    loggedInUserIsAdmin: boolean,
    eventParticipantId: string,
) => {
    "use cache";

    cacheTag(await getUserEventParticipantsCacheTag(loggedInUserId));

    const eventParticipant = await prisma.eventParticipant.findUnique({
        where: {
            id: eventParticipantId,
        },
        include: {
            ticket: {
                include: {
                    event: {
                        include: {
                            tasks: {
                                where: {
                                    assignee_id: loggedInUserId,
                                },
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            },
            user: { select: { id: true, nickname: true } },
        },
    });

    if (eventParticipant) {
        const isEventHost = eventParticipant.ticket.event.host_id === loggedInUserId;
        const isVolunteer = eventParticipant.ticket.event.tasks.length || 0 > 0;
        const isOwnTicket = eventParticipant.user_id === loggedInUserId;

        if (!(loggedInUserIsAdmin || isEventHost || isVolunteer || isOwnTicket))
            throw new Error("Unauthorized");
    }

    return eventParticipant;
};

const TicketPage = async ({ searchParams }: TicketPageProps) => {
    const loggedInUser = await getLoggedInUser();

    const eventParticipantId = (await searchParams).eventParticipantId;

    const eventParticipantPromise = !loggedInUser
        ? Promise.reject(new Error("Unauthorized"))
        : isMembershipExpired(loggedInUser)
          ? Promise.reject(new Error("Unauthorized"))
          : getCachedEventParticipant(
                loggedInUser.id,
                isUserAdmin(loggedInUser),
                eventParticipantId,
            );

    return <TicketDashboard eventParticipantPromise={eventParticipantPromise} />;
};

export default TicketPage;
