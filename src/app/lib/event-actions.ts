"use server";

import { EventStatus, Prisma, TaskStatus, TicketType } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import { CloneEventSchema, EventCreateSchema, EventUpdateSchema, UuidSchema } from "./zod-schemas";
import { informOfCancelledEvent, notifyEventReserves, sendMail } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import { getAbsoluteUrl, isUserAdmin, serverRedirect } from "./utils";
import dayjs from "dayjs";
import { getLoggedInUser } from "./user-actions";
import { getOrganizationSettings } from "./organization-settings-actions";
import { sanitizeFormData } from "./html-sanitizer";
import { createElement } from "react";
import EmailNotificationTemplate from "./mail-service/mail-templates/MailNotificationTemplate";

export const createEvent = async (userId: string, formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = EventCreateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    const { location_id, ...eventData } = sanitizedData;

    // Check that the location has capacity for the max_participants
    const location = await prisma.location.findUniqueOrThrow({
        where: { id: location_id },
    });

    if (location.capacity < validatedData.max_participants) {
        throw new Error("The location can't handle that many participants");
    }

    const createdEvent = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
                                name: `Volunteer ticket for ${validatedData.title}`,
                                description:
                                    "Admittance for one member signed up for at least one volunteer task",
                                // The event host is a participant
                                stock: validatedData.max_participants - 1,
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
                ticket_id: volunteerTicket.product_id,
            },
        });

        return createdEvent;
    });

    revalidateTag(GlobalConstants.EVENT);
    serverRedirect([GlobalConstants.CALENDAR_POST], {
        [GlobalConstants.EVENT_ID]: createdEvent.id,
    });
};

export const getAllEvents = async (userId: string): Promise<Prisma.EventGetPayload<true>[]> => {
    const loggedInUser = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { user_membership: true },
    });

    const filterParams = {} as Prisma.EventWhereInput;

    // Non-admins can only see their own event drafts and pending approval events or published events
    if (!isUserAdmin(loggedInUser)) {
        filterParams.OR = [
            {
                status: EventStatus.published,
            },
            { host_id: userId },
        ];
    }

    return await prisma.event.findMany({
        where: filterParams,
    });
};

export const getEventTags = async (): Promise<string[]> => {
    const events = (await prisma.event.findMany({
        select: { tags: true },
    })) as Prisma.EventGetPayload<{ select: { tags: true } }>[];

    return [...new Set(events.flatMap((event) => event.tags))];
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
};

export const getAllEventsWithTasks = async (): Promise<
    Prisma.EventGetPayload<{ include: { tasks: true } }>[]
> => {
    return prisma.event.findMany({
        include: {
            tasks: true,
        },
    });
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

    // Only event hosts and admins can see event drafts and pending approval events
    const loggedInUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { user_membership: true },
    });
    if (
        event.status !== EventStatus.published &&
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
};

export const updateEvent = async (eventId: string, formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client

    const validatedData = EventUpdateSchema.parse(Object.fromEntries(formData.entries()));
    console.warn(
        "Updating event with form data:",
        Object.fromEntries(formData.entries()),
        validatedData,
    );

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    let notifyEventReservesPromise;
    const eventToUpdate = await prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        include: { tickets: { include: { product: true } }, host: true },
    });

    // Don't allow non-admins to update events to published if event_manager_email is set
    const organizationSettings = await getOrganizationSettings();
    const requireApprovalBeforePublish = !!organizationSettings.event_manager_email;
    const loggedInUser = await getLoggedInUser();
    if (
        requireApprovalBeforePublish &&
        !isUserAdmin(loggedInUser) &&
        eventToUpdate.status !== EventStatus.published &&
        sanitizedData.status === EventStatus.published
    ) {
        throw new Error("You are not authorized to publish this event");
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const eventParticipantsCount = (await getEventParticipants(eventId)).length;

        // Ensure that the new max_participants is not lower than the current number of participants
        if (eventParticipantsCount > sanitizedData.max_participants) {
            throw new Error(
                `The event has ${eventParticipantsCount} participants. Reduce the number of participants before lowering the maximum.`,
            );
        }

        // Add or remove the new number of available tickets to product stock
        // deltaMaxParticipants might be negative
        const deltaMaxParticipants =
            sanitizedData.max_participants - eventToUpdate.max_participants;
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
            if (deltaMaxParticipants > 0) notifyEventReservesPromise = notifyEventReserves(eventId);
        }

        // Notify event manager if event is update to pending approval
        const organizationSettings = await getOrganizationSettings();
        if (
            organizationSettings.event_manager_email &&
            eventToUpdate.status !== EventStatus.pending_approval &&
            sanitizedData.status === EventStatus.pending_approval
        ) {
            const mailContent = createElement(EmailNotificationTemplate, {
                message: "An event has been submitted for approval.",
                linkButtons: [
                    {
                        buttonName: "Go to event",
                        url: getAbsoluteUrl([GlobalConstants.CALENDAR_POST], {
                            [GlobalConstants.EVENT_ID]: eventId,
                        }),
                    },
                ],
            });
            await sendMail(
                [organizationSettings.event_manager_email],
                "Event requires approval",
                mailContent,
            );
        }

        // Notify event host if the event is published
        if (
            eventToUpdate.status !== EventStatus.published &&
            sanitizedData.status === EventStatus.published
        ) {
            const mailContent = createElement(EmailNotificationTemplate, {
                message: "Your event has been published.",
                linkButtons: [
                    {
                        buttonName: "Go to event",
                        url: getAbsoluteUrl([GlobalConstants.CALENDAR_POST], {
                            [GlobalConstants.EVENT_ID]: eventId,
                        }),
                    },
                ],
            });
            await sendMail(eventToUpdate.host.email, "Event published", mailContent);
        }

        await prisma.event.update({
            where: { id: eventId },
            data: sanitizedData,
        });
        revalidateTag(GlobalConstants.EVENT);
        revalidateTag(GlobalConstants.TICKET);
        try {
            if (notifyEventReservesPromise) await notifyEventReservesPromise;
        } catch {
            // Allow the update despite failed notification
            console.error("Failed to notify reserves in event of extra available tickets");
        }
    });
};

export const cancelEvent = async (eventId: string): Promise<void> => {
    // Validate event ID format
    const validatedEventId = UuidSchema.parse(eventId);

    const cancelFormData = new FormData();
    cancelFormData.append(GlobalConstants.STATUS, EventStatus.cancelled);
    await updateEvent(validatedEventId, cancelFormData);
    revalidateTag(GlobalConstants.EVENT);

    try {
        await informOfCancelledEvent(validatedEventId);
    } catch (error) {
        // Allow cancelling despite failed notification
        console.error("Failed to inform of cancelled event:", error);
    }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
    // Validate event ID format
    const validatedEventId = UuidSchema.parse(eventId);

    const event = await prisma.event.findUniqueOrThrow({
        where: { id: validatedEventId },
        include: {
            tickets: {
                include: {
                    event_participants: true,
                },
            },
        },
    });

    const eventParticipants = await getEventParticipants(validatedEventId);
    const onlyHostIsParticipating =
        eventParticipants.length === 1 && eventParticipants[0].user_id === event.host_id;
    if (!onlyHostIsParticipating)
        throw new Error(
            "The event has participants and cannot be deleted. Cancel the event instead",
        );

    await prisma.$transaction([
        prisma.eventReserve.deleteMany({
            where: { event_id: validatedEventId },
        }),
        prisma.eventParticipant.deleteMany({
            where: { ticket: { event_id: validatedEventId } },
        }),
        prisma.product.deleteMany({
            where: { ticket: { event_id: validatedEventId } },
        }),
        prisma.event.delete({
            where: { id: validatedEventId },
        }),
    ]);
    revalidateTag(GlobalConstants.EVENT);
    serverRedirect([GlobalConstants.CALENDAR]);
};

export const cloneEvent = async (eventId: string, formData: FormData) => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = CloneEventSchema.parse(Object.fromEntries(formData.entries()));

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

    const loggedInUser = await getLoggedInUser();

    const eventClone = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Copy event itself with default values
        const createdEvent = await tx.event.create({
            data: {
                ...{
                    ...eventData,
                    status: EventStatus.draft,
                    title: `${eventData.title} (Clone)`,
                    start_time: validatedData.start_time,
                    end_time: dayjs
                        .utc(validatedData.start_time)
                        .add(dayjs.utc(eventData.end_time).diff(eventData.start_time))
                        .toISOString(),
                },
                host: {
                    connect: { id: loggedInUser.id },
                },
                ...(location_id && { location: { connect: { id: location_id } } }),
            },
        });

        // Copy tickets
        const clonedTickets = await Promise.all(
            tickets.map(async (ticket) => {
                const {
                    product_id: ticketIdToOmit, // eslint-disable-line no-unused-vars
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
                    connect: { id: loggedInUser.id },
                },
                ticket: {
                    connect: { product_id: volunteerTicket.product_id },
                },
            },
        });

        // Copy tasks
        const moveTaskTimeForward = (taskTime: Date) =>
            dayjs
                .utc(taskTime)
                .add(dayjs.utc(validatedData.start_time).diff(dayjs.utc(eventData.start_time)))
                .toISOString();

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
                    reviewer_id: loggedInUser.id,
                    // Create tasks as "To Do"
                    status: TaskStatus.toDo,
                    start_time: moveTaskTimeForward(taskData.start_time),
                    end_time: moveTaskTimeForward(taskData.end_time),
                } as Prisma.TaskCreateManyInput;
            }),
        });
        return createdEvent;
    });

    revalidateTag(GlobalConstants.EVENT);
    serverRedirect([GlobalConstants.CALENDAR_POST], { [GlobalConstants.EVENT_ID]: eventClone.id });
};
