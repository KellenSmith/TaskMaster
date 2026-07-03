import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import { getLoggedInUser } from "../../lib/user-helpers";
import { isUserAdmin } from "../../lib/utils";
import ProtectedPage from "../../ProtectedPage";
import TicketDashboard from "./TicketDashboard";

interface TicketPageProps {
    searchParams: Promise<{ [eventParticipantId: string]: string }>;
}

const getCachedEventParticipant = async (
    loggedInUserId: string,
    loggedInUserIsAdmin: boolean,
    eventParticipantId: string,
) => {
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
    const eventParticipantId = (await searchParams).eventParticipantId;
    const loggedInUser = await getLoggedInUser();

    const eventParticipantPromise = getCachedEventParticipant(
        loggedInUser!.id,
        isUserAdmin(loggedInUser),
        eventParticipantId,
    );

    return (
        <ProtectedPage name={GlobalConstants.TICKET}>
            <TicketDashboard eventParticipantPromise={eventParticipantPromise} />
        </ProtectedPage>
    );
};

export default TicketPage;
