import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import { isMembershipExpired, isUserAdmin } from "../../lib/utils";
import TicketDashboard from "./TicketDashboard";

interface TicketPageProps {
    searchParams: Promise<{ [eventParticipantId: string]: string }>;
}

const TicketPage = async ({ searchParams }: TicketPageProps) => {
    const loggedInUser = await getLoggedInUser();
    if (isMembershipExpired(loggedInUser)) throw new Error("Unauthorized");

    const eventParticipantId = (await searchParams).eventParticipantId;

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
                                    assignee_id: loggedInUser!.id,
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
        const isEventHost = eventParticipant.ticket.event.host_id === loggedInUser!.id;
        const isVolunteer = eventParticipant.ticket.event.tasks.length || 0 > 0;
        const isOwnTicket = eventParticipant.user_id === loggedInUser!.id;

        if (!(isUserAdmin(loggedInUser) || isEventHost || isVolunteer || isOwnTicket))
            throw new Error("Unauthorized");
    }

    return <TicketDashboard eventParticipant={eventParticipant} />;
};

export default TicketPage;
