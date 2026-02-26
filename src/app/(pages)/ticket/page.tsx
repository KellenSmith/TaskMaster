import { prisma } from "../../../prisma/prisma-client";
// ...existing code...
import TicketDashboard from "./TicketDashboard";

interface TicketPageProps {
    searchParams: Promise<{ [eventParticipantId: string]: string }>;
}

const TicketPage = async ({ searchParams }: TicketPageProps) => {
    const eventParticipantId = (await searchParams).eventParticipantId;

    const eventParticipantPromise = prisma.eventParticipant.findUnique({
        where: {
            id: eventParticipantId,
        },
        include: {
            ticket: { include: { event: true } },
            user: { select: { id: true, nickname: true } },
        },
    });

    return <TicketDashboard eventParticipantPromise={eventParticipantPromise} />;
};

export default TicketPage;
