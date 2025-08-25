"use server";

import { EventStatus, Prisma, TicketType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../prisma/prisma-client";
import { EventCreateSchema, EventUpdateSchema } from "./zod-schemas";
import { informOfCancelledEvent } from "./mail-service/mail-service";
import { getLoggedInUser } from "./user-actions";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import { NextURL } from "next/dist/server/web/next-url";
import { redirect } from "next/navigation";
import { isUserHost, serverRedirect } from "./definitions";
import { allowRedirectException } from "../ui/utils";
import dayjs from "dayjs";

export const createEvent = async (
    parsedFieldValues: z.infer<typeof EventCreateSchema>,
): Promise<void> => {
    try {
        const loggedInUser = await getLoggedInUser();
        const createdEvent = await prisma.$transaction(async (tx) => {
            // Create event with ticket
            const createdEvent = await tx.event.create({
                data: {
                    ...parsedFieldValues,
                    host: {
                        connect: {
                            id: loggedInUser.id,
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
                                    stock: parsedFieldValues.maxParticipants - 1,
                                },
                            },
                        },
                    },
                },
                include: {
                    tickets: true,
                },
            });

            // Create event participant
            const volunteerTicket = createdEvent.tickets[0]; // Since we just created one ticket
            await tx.eventParticipant.create({
                data: {
                    userId: loggedInUser.id,
                    ticketId: volunteerTicket.id,
                },
            });

            return createdEvent;
        });

        revalidateTag(GlobalConstants.EVENT);
        redirect(
            new NextURL(
                `/${GlobalConstants.EVENT}?eventId=${createdEvent.id}`,
                process.env.VERCEL_URL,
            ).toString(),
        );
    } catch (error) {
        allowRedirectException(error);
        throw new Error("Failed to create event");
    }
};

export const getAllEvents = async (): Promise<Prisma.EventGetPayload<true>[]> => {
    try {
        const events = await prisma.event.findMany();
        return events;
    } catch {
        throw new Error("Failed to fetch events");
    }
};

export const getFilteredEvents = async (
    filters: Prisma.EventWhereInput,
): Promise<
    Prisma.EventGetPayload<{
        include: {
            tickets: { include: { eventParticipants: true } };
            eventReserves: true;
        };
    }>[]
> => {
    try {
        const events = await prisma.event.findMany({
            where: filters,
            include: {
                host: {
                    select: {
                        id: true,
                    },
                },
                tickets: {
                    include: {
                        eventParticipants: true,
                    },
                },
                eventReserves: true,
            },
        });
        return events;
    } catch {
        throw new Error("Failed to fetch events");
    }
};

export const getEventById = async (
    eventId: string,
): Promise<
    Prisma.EventGetPayload<{
        include: { tickets: { include: { eventParticipants: true } }; eventReserves: true };
    }>
> => {
    try {
        const event = await prisma.event.findUniqueOrThrow({
            where: {
                id: eventId,
            },
            include: {
                tickets: {
                    include: {
                        eventParticipants: true,
                    },
                },
                eventReserves: true,
            },
        });

        // Only event hosts can see event drafts
        const loggedInUser = await getLoggedInUser();
        if (event.status === EventStatus.draft && !isUserHost(loggedInUser, event)) {
            throw new Error("You are not authorized to view this event");
        }

        return event;
    } catch {
        throw new Error("Failed to fetch event");
    }
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
                    eventId: eventId,
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
    try {
        const eventToUpdate = await prisma.event.findUniqueOrThrow({
            where: { id: eventId },
            include: { tickets: { include: { product: true } } },
        });

        await prisma.$transaction(async (tx) => {
            const eventParticipantsCount = (await getEventParticipants(eventId)).length;

            // Ensure that the new maxParticipants is not lower than the current number of participants
            if (eventParticipantsCount > parsedFieldValues.maxParticipants) {
                throw new Error(
                    `The event has ${eventParticipantsCount} participants. Reduce the number of participants before lowering the maximum.`,
                );
            }

            // Add or remove the new number of available tickets to product stock
            // deltaMaxParticipants might be negative
            const deltaMaxParticipants =
                parsedFieldValues.maxParticipants - eventToUpdate.maxParticipants;
            if (deltaMaxParticipants !== 0) {
                const productsToUpdate = eventToUpdate.tickets.map((ticket) => ticket.product);
                await tx.product.updateMany({
                    where: { id: { in: productsToUpdate.map((product) => product.id) } },
                    data: {
                        stock: {
                            increment: deltaMaxParticipants,
                        },
                    },
                });
            }
        });
        await prisma.event.update({
            where: { id: eventId },
            data: parsedFieldValues,
        });
        revalidateTag(GlobalConstants.EVENT);
        revalidateTag(GlobalConstants.TICKET);
    } catch {
        throw new Error("Failed to update event");
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
                        eventParticipants: true,
                    },
                },
            },
        });

        const eventParticipants = await getEventParticipants(eventId);
        const onlyHostIsParticipating =
            eventParticipants.length === 1 && eventParticipants[0].userId === event.hostId;
        if (!onlyHostIsParticipating)
            throw new Error(
                "The event has participants and cannot be deleted. Cancel the event instead",
            );

        await prisma.$transaction([
            prisma.eventReserve.deleteMany({
                where: { eventId },
            }),
            prisma.eventParticipant.deleteMany({
                where: { ticket: { eventId } },
            }),
            prisma.ticket.deleteMany({
                where: { eventId },
            }),
            prisma.event.delete({
                where: { id: eventId },
            }),
        ]);
        revalidateTag(GlobalConstants.EVENT);
        serverRedirect(GlobalConstants.CALENDAR);
    } catch (error) {
        allowRedirectException(error);
        throw new Error("Failed to delete event");
    }
};

export const cloneEvent = async (eventId: string) => {
    try {
        const loggedInUser = await getLoggedInUser();
        const {
            id: eventIdToOmit,
            hostId: hostIdToOmit,
            ...eventData
        } = await prisma.event.findUniqueOrThrow({
            where: { id: eventId },
        });
        const tickets = await prisma.ticket.findMany({
            where: { eventId },
            include: { product: true },
        });
        const tasks = await prisma.task.findMany({
            where: { eventId },
        });

        const eventClone = await prisma.$transaction(async (tx) => {
            // Copy event itself with default values
            const createdEvent = await tx.event.create({
                data: {
                    ...{
                        ...eventData,
                        status: EventStatus.draft,
                        title: `${eventData.title} (Clone)`,
                        startTime: dayjs().hour(18).minute(0).toDate(),
                        endTime: dayjs().hour(22).minute(0).toDate(),
                    },
                    host: {
                        connect: { id: loggedInUser.id },
                    },
                },
            });

            // Copy tickets
            const clonedTickets = await Promise.all(
                tickets.map(async (ticket) => {
                    const {
                        id: ticketIdToOmit,
                        eventId: eventIdToOmit,
                        productId: ticketProductIdToOmit,
                        product,
                        ...ticketData
                    } = ticket;
                    const { id: productIdToOmit, ...productData } = product;
                    return tx.ticket.create({
                        data: {
                            ...ticketData,
                            type: ticket.type,
                            product: {
                                create: {
                                    ...productData,
                                    // The event host is a participant
                                    stock: eventData.maxParticipants - 1,
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
                        connect: { id: loggedInUser.id },
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
                        id: taskIdToOmit,
                        // Create the tasks as unassigned
                        assigneeId: taskAssigneeIdToOmit,
                        reviewerId: taskReviewerIdToOmit,
                        ...taskData
                    } = task;
                    return {
                        ...taskData,
                        eventId: createdEvent.id,
                        // Add logged in user as reviewer
                        reviewerId: loggedInUser.id,
                    } as Prisma.TaskCreateManyInput;
                }),
            });
            return createdEvent;
        });

        revalidateTag(GlobalConstants.EVENT);
        serverRedirect(GlobalConstants.EVENT, { [GlobalConstants.EVENT_ID]: eventClone.id });
    } catch (error) {
        allowRedirectException(error);
        throw new Error("Failed to clone event");
    }
};
