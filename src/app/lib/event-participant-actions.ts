"use server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../prisma/prisma-client";
import { notifyEventReserves } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { Prisma } from "@/prisma/generated/client";
import { deleteEventReserveWithTx } from "./event-reserve-actions";
import { UuidSchema } from "./zod-schemas";
import { getUserLanguage } from "./user-actions";
import LanguageTranslations from "./LanguageTranslations";
import dayjs from "dayjs";

export const addEventParticipantWithTx = async (
    tx: Prisma.TransactionClient,
    ticketId: string,
    userId: string,
) => {
    // Validate ID formats
    const validatedTicketId = UuidSchema.parse(ticketId);
    const validatedUserId = UuidSchema.parse(userId);

    const ticket = await prisma.ticket.findUniqueOrThrow({
        where: {
            product_id: validatedTicketId,
        },
    });

    // Check that the event isn't sold out
    const event = await prisma.event.findUniqueOrThrow({
        where: {
            id: ticket.event_id,
        },
        include: {
            tickets: {
                include: {
                    event_participants: true,
                },
            },
        },
    });
    const participantIds = event.tickets.flatMap((t) => t.event_participants.map((p) => p.user_id));
    if (participantIds.includes(validatedUserId))
        throw new Error("Member is already a participant");
    if (participantIds.length >= event.max_participants) {
        throw new Error("Event is already sold out");
    }

    await deleteEventReserveWithTx(tx, validatedUserId, ticket.event_id);
    revalidateTag(GlobalConstants.RESERVE_USERS, "max");

    // Decrement the product stock of all tickets with limited stock belonging to the same event
    // Ticket product stock reflects the total number of available tickets across all types
    await tx.product.updateMany({
        where: {
            ticket: {
                event_id: ticket.event_id,
            },
            NOT: {
                stock: null,
            },
        },
        data: {
            stock: {
                decrement: 1,
            },
        },
    });
    revalidateTag(GlobalConstants.TICKET, "max");
    // Create the participant and connect it to the user, ticket, and event
    await tx.eventParticipant.create({
        data: {
            user: {
                connect: {
                    id: userId,
                },
            },
            ticket: {
                connect: {
                    product_id: ticketId,
                },
            },
        },
    });
    revalidateTag(GlobalConstants.PARTICIPANT_USERS, "max");
    revalidateTag(GlobalConstants.EVENT, "max");
};

export const addEventParticipant = async (userId: string, ticketId: string) => {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await addEventParticipantWithTx(tx, ticketId, userId);
    });
};

export const deleteEventParticipantWithTx = async (
    tx: Prisma.TransactionClient,
    eventId: string,
    userId: string,
) => {
    // Find the ticket the user holds to the event
    const ticket = await tx.ticket.findFirstOrThrow({
        where: {
            event_id: eventId,
            event_participants: {
                some: {
                    user_id: userId,
                },
            },
        },
    });
    await tx.eventParticipant.deleteMany({
        where: {
            user_id: userId,
            ticket_id: ticket.product_id,

        },
    });
    // Increment the product stock of all tickets with limited stock belonging to the same event
    // Ticket product stock reflects the total number of available tickets across all types
    await tx.product.updateMany({
        where: {
            ticket: {
                event_id: eventId,
            },
            NOT: {
                stock: null,
            },
        },
        data: {
            stock: {
                increment: 1,
            },
        },
    });

    revalidateTag(GlobalConstants.PARTICIPANT_USERS, "max");
    revalidateTag(GlobalConstants.EVENT, "max");
    revalidateTag(GlobalConstants.TICKET, "max");
    await notifyEventReserves(eventId);
};

export const deleteEventParticipant = async (eventId: string, userId: string) => {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await deleteEventParticipantWithTx(tx, eventId, userId);
        await unassignUserFromEventTasks(tx, eventId, userId);
    });
};

export const unassignUserFromEventTasks = async (
    tx: Prisma.TransactionClient,
    eventId: string,
    userId: string,
) => {
    // Unassign any tasks assigned to the user happening during the event
    const event = await tx.event.findUniqueOrThrow({
        where: { id: eventId },
    });
    await tx.task.updateMany({
        where: {
            AND: [
                {
                    OR: [
                        {
                            start_time: {
                                gte: event.start_time,
                                lte: event.end_time,
                            },
                        },
                        {
                            end_time: {
                                gte: event.start_time,
                                lte: event.end_time,
                            },
                        },
                    ],
                },
            ],
            event_id: eventId,
            assignee_id: userId,
        },
        data: {
            assignee_id: null,
        },
    });
};

export const checkInEventParticipant = async (eventParticipantId: string): Promise<void | string> => {
    const validatedEventParticipantId = UuidSchema.parse(eventParticipantId);
    const language = await getUserLanguage()
    try {
        const eventParticipant = await prisma.eventParticipant.findUniqueOrThrow({
            where: {
                id: validatedEventParticipantId,
            },
            include: {
                ticket: {
                    include: {
                        event: true,
                    }
                }
            }
        })
        if (eventParticipant.checked_in_at) {
            return LanguageTranslations.alreadyCheckedIn[language];
        }

        // Dont check in if not within one hour of event opening hours
        const now = dayjs()
        const eventStart = dayjs(eventParticipant.ticket.event.start_time);
        const eventEnd = dayjs(eventParticipant.ticket.event.end_time);
        if (now.isBefore(eventStart.subtract(1, "hour")) || now.isAfter(eventEnd.add(1, "hour"))) {
            return
        }

        await prisma.eventParticipant.update({
            where: {
                id: validatedEventParticipantId,
            },
            data: {
                checked_in_at: new Date(),
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PrismaErrorCodes.resultNotFound) {
            return LanguageTranslations.eventParticipantNotFound[language];
        }
        console.error("Unknown Prisma error during check-in:", error);

    }
}
