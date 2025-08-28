"use server";

import { EventStatus, Prisma, TaskStatus, TicketType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../prisma/prisma-client";
import { EventCreateSchema, EventUpdateSchema } from "./zod-schemas";
import { informOfCancelledEvent, notifyEventReserves } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import { isUserAdmin, serverRedirect } from "./definitions";
import { allowRedirectException } from "../ui/utils";
import dayjs from "dayjs";

export const createEvent = async (
    userId: string,
    parsedFieldValues: z.infer<typeof EventCreateSchema>,
): Promise<void> => {
    const { location_id, ...eventData } = parsedFieldValues;

    // Check that the location has capacity for the max_participants
    const location = await prisma.location.findUniqueOrThrow({
        where: { id: location_id },
    });

    if (location.capacity < parsedFieldValues.max_participants) {
        throw new Error("The location can't handle that many participants");
    }

    const createdEvent = await prisma.$transaction(async (tx) => {
        // Create event with ticket
        const createdEvent = await tx.event.create({
            data: {
                ...eventData,
                host: {
                    connect: {
                        id: userId,
                    },
                },
                tickets: {
                    create: {
                        type: TicketType.volunteer,
                        product: {
                            create: {
                                name: `Volunteer ticket for ${parsedFieldValues.title}`,
                                description:
                                    "Admittance for one member signed up for at least one volunteer task",
                                // The event host is a participant
                                stock: parsedFieldValues.max_participants - 1,
                            },
                        },
                    },
                },
                ...(location_id && { location: { connect: { id: location_id } } }),
            },
            include: {
                tickets: true,
            },
        });

        // Create event participant
        const volunteerTicket = createdEvent.tickets[0]; // Since we just created one ticket
        await tx.eventParticipant.create({
            data: {
                user_id: userId,
                ticket_id: volunteerTicket.id,
            },
        });

        return createdEvent;
    });

    revalidateTag(GlobalConstants.EVENT);
    serverRedirect([GlobalConstants.EVENT], { [GlobalConstants.EVENT_ID]: createdEvent.id });
};

export const getAllEvents = async (userId: string): Promise<Prisma.EventGetPayload<true>[]> => {
    const loggedInUser = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
    });

    const filterParams = {} as Prisma.EventWhereInput;

    // Non-admins can only see their own event drafts
    if (!isUserAdmin(loggedInUser)) {
        filterParams.OR = [
            {
                status: {
                    not: EventStatus.draft,
                },
            },
            { host_id: userId },
        ];
    }

    return await prisma.event.findMany({
        where: filterParams,
    });
};

export const getFilteredEvents = async (
    filters: Prisma.EventWhereInput,
): Promise<
    Prisma.EventGetPayload<{
        include: {
            location: true;
            tickets: { include: { event_participants: true } };
            event_reserves: true;
        };
    }>[]
> => {
    try {
        const events = await prisma.event.findMany({
            where: filters,
            include: {
                location: true,
                host: {
                    select: {
                        id: true,
                    },
                },
                tickets: {
                    include: {
                        event_participants: true,
                    },
                },
                event_reserves: true,
            },
        });
        return events;
    } catch {
        throw new Error("Failed to fetch events");
    }
};

export const getEventById = async (
    eventId: string,
    userId: string,
): Promise<
    Prisma.EventGetPayload<{
        include: {
            location: true;
            tickets: { include: { event_participants: true } };
            event_reserves: true;
        };
    }>
> => {
    const event = await prisma.event.findUniqueOrThrow({
        where: {
            id: eventId,
        },
        include: {
            location: true,
            tickets: {
                include: {
                    event_participants: true,
                },
            },
            event_reserves: true,
        },
    });

    // Only event hosts and admins can see event drafts
    const loggedInUser = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (
        event.status === EventStatus.draft &&
        !isUserAdmin(loggedInUser) &&
        event.host_id !== userId
    ) {
        throw new Error("You are not authorized to view this event");
    }
    return event;
};

export const getEventParticipants = async (
    eventId: string,
): Promise<
    Prisma.EventParticipantGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[]
> => {
    try {
        const participants = await prisma.eventParticipant.findMany({
            where: {
                ticket: {
                    event_id: eventId,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nickname: true,
                    },
                },
            },
        });
        return participants;
    } catch {
        throw new Error("Failed to fetch event participants");
    }
};

export const updateEvent = async (
    eventId: string,
    parsedFieldValues: z.infer<typeof EventUpdateSchema>,
): Promise<void> => {
    let notifyEventReservesPromise;
    try {
        const eventToUpdate = await prisma.event.findUniqueOrThrow({
            where: { id: eventId },
            include: { tickets: { include: { product: true } } },
        });

        await prisma.$transaction(async (tx) => {
            const eventParticipantsCount = (await getEventParticipants(eventId)).length;

            // Ensure that the new max_participants is not lower than the current number of participants
            if (eventParticipantsCount > parsedFieldValues.max_participants) {
                throw new Error(
                    `The event has ${eventParticipantsCount} participants. Reduce the number of participants before lowering the maximum.`,
                );
            }

            // Add or remove the new number of available tickets to product stock
            // deltaMaxParticipants might be negative
            const deltaMaxParticipants =
                parsedFieldValues.max_participants - eventToUpdate.max_participants;
            if (Math.abs(deltaMaxParticipants)) {
                const productsToUpdate = eventToUpdate.tickets.map((ticket) => ticket.product);
                await tx.product.updateMany({
                    where: { id: { in: productsToUpdate.map((product) => product.id) } },
                    data: {
                        stock: {
                            increment: deltaMaxParticipants,
                        },
                    },
                });
                if (deltaMaxParticipants > 0)
                    notifyEventReservesPromise = notifyEventReserves(eventId);
            }
        });
        await prisma.event.update({
            where: { id: eventId },
            data: parsedFieldValues,
        });
        revalidateTag(GlobalConstants.EVENT);
        revalidateTag(GlobalConstants.TICKET);
    } catch (error) {
        console.error("Failed to update event:", error.message);
        throw new Error("Failed to update event");
    }

    try {
        if (notifyEventReservesPromise) await notifyEventReservesPromise;
    } catch {
        console.error("Failed to notify reserves in event of extra available tickets");
    }
};

export const cancelEvent = async (eventId: string): Promise<void> => {
    try {
        await updateEvent(eventId, { status: EventStatus.cancelled });
        revalidateTag(GlobalConstants.EVENT);
    } catch {
        throw new Error("Failed to cancel event");
    }
    try {
        await informOfCancelledEvent(eventId);
    } catch (error) {
        throw new Error(error.message);
    }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
    try {
        const event = await prisma.event.findUniqueOrThrow({
            where: { id: eventId },
            include: {
                tickets: {
                    include: {
                        event_participants: true,
                    },
                },
            },
        });

        const eventParticipants = await getEventParticipants(eventId);
        const onlyHostIsParticipating =
            eventParticipants.length === 1 && eventParticipants[0].user_id === event.host_id;
        if (!onlyHostIsParticipating)
            throw new Error(
                "The event has participants and cannot be deleted. Cancel the event instead",
            );

        await prisma.$transaction([
            prisma.eventReserve.deleteMany({
                where: { event_id: eventId },
            }),
            prisma.eventParticipant.deleteMany({
                where: { ticket: { event_id: eventId } },
            }),
            prisma.ticket.deleteMany({
                where: { event_id: eventId },
            }),
            prisma.event.delete({
                where: { id: eventId },
            }),
        ]);
        revalidateTag(GlobalConstants.EVENT);
        serverRedirect([GlobalConstants.CALENDAR]);
    } catch (error) {
        allowRedirectException(error);
        throw new Error("Failed to delete event");
    }
};

// TODO: Find a way of retrieving the user from the server session rather
// than taking it as an argument
export const cloneEvent = async (userId: string, eventId: string) => {
    try {
        const {
            id: eventIdToOmit, // eslint-disable-line no-unused-vars
            host_id: hostIdToOmit, // eslint-disable-line no-unused-vars
            location_id,
            ...eventData
        } = await prisma.event.findUniqueOrThrow({
            where: { id: eventId },
        });
        const tickets = await prisma.ticket.findMany({
            where: { event_id: eventId },
            include: { product: true },
        });
        const tasks = await prisma.task.findMany({
            where: { event_id: eventId },
        });

        const eventClone = await prisma.$transaction(async (tx) => {
            // Copy event itself with default values
            const createdEvent = await tx.event.create({
                data: {
                    ...{
                        ...eventData,
                        status: EventStatus.draft,
                        title: `${eventData.title} (Clone)`,
                        start_time: dayjs().hour(18).minute(0).toDate(),
                        end_time: dayjs().hour(22).minute(0).toDate(),
                    },
                    host: {
                        connect: { id: userId },
                    },
                    ...(location_id && { location: { connect: { id: location_id } } }),
                },
            });

            // Copy tickets
            const clonedTickets = await Promise.all(
                tickets.map(async (ticket) => {
                    const {
                        id: ticketIdToOmit, // eslint-disable-line no-unused-vars
                        event_id: eventIdToOmit, // eslint-disable-line no-unused-vars
                        product_id: ticketProductIdToOmit, // eslint-disable-line no-unused-vars
                        product,
                        ...ticketData
                    } = ticket;
                    // eslint-disable-next-line no-unused-vars
                    const { id: productIdToOmit, ...productData } = product;
                    return tx.ticket.create({
                        data: {
                            ...ticketData,
                            type: ticket.type,
                            product: {
                                create: {
                                    ...productData,
                                    // The event host is a participant
                                    stock: eventData.max_participants - 1,
                                },
                            },
                            event: {
                                connect: { id: createdEvent.id },
                            },
                        },
                    });
                }),
            );

            // Add the event host as participant
            const volunteerTicket = clonedTickets.find((t) => t.type === TicketType.volunteer);
            await tx.eventParticipant.create({
                data: {
                    user: {
                        connect: { id: userId },
                    },
                    ticket: {
                        connect: { id: volunteerTicket.id },
                    },
                },
            });

            // Copy tasks
            await tx.task.createMany({
                data: tasks.map((task) => {
                    const {
                        id: taskIdToOmit, // eslint-disable-line no-unused-vars
                        // Create the tasks as unassigned
                        assignee_id: taskAssigneeIdToOmit, // eslint-disable-line no-unused-vars
                        reviewer_id: taskReviewerIdToOmit, // eslint-disable-line no-unused-vars
                        ...taskData
                    } = task;
                    return {
                        ...taskData,
                        event_id: createdEvent.id,
                        // Add logged in user as reviewer
                        reviewer_id: userId,
                        // Create tasks as "To Do"
                        status: TaskStatus.toDo,
                    } as Prisma.TaskCreateManyInput;
                }),
            });
            return createdEvent;
        });

        revalidateTag(GlobalConstants.EVENT);
        serverRedirect([GlobalConstants.EVENT], { [GlobalConstants.EVENT_ID]: eventClone.id });
    } catch (error) {
        allowRedirectException(error);
        throw new Error("Failed to clone event");
    }
};
