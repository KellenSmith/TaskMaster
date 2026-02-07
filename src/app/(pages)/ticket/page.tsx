import { Prisma } from "../../../prisma/generated/client";
import { prisma } from "../../../prisma/prisma-client";

interface TicketPageProps {
    searchParams: Promise<{ [eventParticipantId: string]: string }>;
}

const TicketPage = async ({ searchParams }: TicketPageProps) => {
    console.log(await searchParams)
    const eventParticipantId = (await searchParams).eventParticipantId;

    let eventParticipant: Prisma.EventParticipantGetPayload<{ include: { ticket: { include: { event: true } }, user: { select: { id: true, nickname: true } } } }>;
    try {
        eventParticipant = await prisma.eventParticipant.findUniqueOrThrow({
            where: {
                id: eventParticipantId,
            },
            include: {
                ticket: { include: { event: true } },
                user: { select: { id: true, nickname: true } },
            }
        });
    } catch (error) {
        return <div>this is not a ticket</div>
    }
    const ticket = eventParticipant.ticket;
    const event = eventParticipant.ticket.event;
    const user = eventParticipant.user;



    return (
        <div>
            <h1>Ticket Page</h1>
            <p>This is where you can view your ticket with ID: {eventParticipant.id}.</p>
            <p>Event: {event.title}</p>
            <p>User: {user.nickname}</p>
            <p>Ticket type: {ticket.type}</p>
        </div>
    );
}

export default TicketPage;
