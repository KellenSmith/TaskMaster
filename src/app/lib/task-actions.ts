"use server";

import { Prisma, TaskStatus, TicketType } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import z from "zod";
import { ContactMemberSchema, TaskCreateSchema, TaskUpdateSchema, UuidSchema } from "./zod-schemas";
import { memberContactMember, notifyTaskReviewer } from "./mail-service/mail-service";
import {
    addEventParticipantWithTx,
    deleteEventParticipantWithTx,
} from "./event-participant-actions";
import { addEventReserveWithTx } from "./event-reserve-actions";
import { getLoggedInUser } from "./user-actions";

export const deleteTask = async (taskId: string): Promise<void> => {
    // Validate task ID format
    const validatedTaskId = UuidSchema.parse(taskId);

    await prisma.task.delete({
        where: {
            id: validatedTaskId,
        },
    });
    revalidateTag(GlobalConstants.TASK);
};

export const getTaskById = async (
    taskId: string,
): Promise<
    Prisma.TaskGetPayload<{
        include: {
            assignee: { select: { id: true; nickname: true } };
            reviewer: { select: { id: true; nickname: true } };
            event: true;
            skill_badges: true;
        };
    }>
> => {
    // Validate task ID format
    const validatedTaskId = UuidSchema.parse(taskId);

    return await prisma.task.findUniqueOrThrow({
        where: {
            id: validatedTaskId,
        },
        include: {
            assignee: { select: { id: true, nickname: true } },
            reviewer: { select: { id: true, nickname: true } },
            event: true,
            skill_badges: true,
        },
    });
};

export const updateTaskById = async (
    taskId: string,
    parsedFieldValues: z.infer<typeof TaskUpdateSchema>,
    eventId: string | null,
): Promise<void> => {
    // Validate task ID format
    const validatedTaskId = UuidSchema.parse(taskId);
    // Validate event ID format if provided
    const validatedEventId = eventId ? UuidSchema.parse(eventId) : null;
    // Revalidate input with zod schema - don't trust the client
    const validatedData = TaskUpdateSchema.parse(parsedFieldValues);

    const oldTask = await prisma.task.findUniqueOrThrow({
        where: {
            id: validatedTaskId,
        },
    });

    const {
        reviewer_id: reviewerId,
        assignee_id: assigneeId,
        skill_badges: newSkillBadges,
        ...taskWithoutUsers
    } = validatedData;

    await prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
            where: {
                id: validatedTaskId,
            },
            data: {
                ...taskWithoutUsers,
                tags: validatedData.tags,
                ...(assigneeId && {
                    assignee: {
                        connect: {
                            id: assigneeId,
                        },
                    },
                }),
                ...(reviewerId && {
                    reviewer: {
                        connect: {
                            id: reviewerId,
                        },
                    },
                }),
                ...(validatedEventId && {
                    event: {
                        connect: {
                            id: validatedEventId,
                        },
                    },
                }),
            },
            include: { reviewer: true },
        });

        // Update skill badges
        if (newSkillBadges) {
            await prisma.taskSkillBadge.deleteMany({
                where: {
                    task_id: taskId,
                },
            });
            await prisma.taskSkillBadge.createMany({
                data: newSkillBadges.map((badgeId) => ({
                    task_id: taskId,
                    skill_badge_id: badgeId,
                })),
            });
        }

        // Notify reviewer if assigned of:
        // task ready for review
        // unassigned if not status to do
        let notificationMessage = "";
        if (updatedTask.reviewer_id) {
            if (
                updatedTask.status === TaskStatus.inReview &&
                oldTask.status !== TaskStatus.inReview
            ) {
                notificationMessage = `\nTask "${updatedTask.name}" is ready for review`;
            }
            if (
                oldTask.assignee_id &&
                !updatedTask.assignee_id &&
                updatedTask.status !== TaskStatus.toDo
            ) {
                notificationMessage = `\nTask "${updatedTask.name}" has been unassigned`;
            }
            if (notificationMessage)
                await notifyTaskReviewer(
                    updatedTask.reviewer.email,
                    updatedTask.name,
                    notificationMessage,
                );
        }
    });

    revalidateTag(GlobalConstants.TASK);
};

export const createTask = async (
    parsedFieldValues: z.infer<typeof TaskCreateSchema>,
    eventId: string | null,
): Promise<void> => {
    // Validate event ID format if provided
    const validatedEventId = eventId ? UuidSchema.parse(eventId) : null;
    // Revalidate input with zod schema - don't trust the client
    const validatedData = TaskCreateSchema.parse(parsedFieldValues);

    const {
        assignee_id: assigneeId,
        reviewer_id: reviewerId,
        skill_badges: skillBadges,
        ...taskWithoutUsers
    } = validatedData;

    await prisma.task.create({
        data: {
            ...taskWithoutUsers,
            tags: parsedFieldValues.tags,
            ...(assigneeId && {
                assignee: {
                    connect: {
                        id: assigneeId,
                    },
                },
            }),
            ...(reviewerId && {
                reviewer: {
                    connect: {
                        id: reviewerId,
                    },
                },
            }),
            ...(validatedEventId && {
                event: {
                    connect: {
                        id: validatedEventId,
                    },
                },
            }),
            ...(skillBadges && {
                skill_badges: {
                    createMany: {
                        data: skillBadges.map((badgeId) => ({
                            skill_badge_id: badgeId,
                        })) as Prisma.TaskSkillBadgeCreateManyTaskInput[],
                    },
                },
            }),
        },
        include: { reviewer: true },
    });
    revalidateTag(GlobalConstants.TASK);
};

export const getFilteredTasks = async (
    searchParams: Prisma.TaskWhereInput | null, // Null if fetching default tasks
): Promise<
    Prisma.TaskGetPayload<{
        include: {
            assignee: { select: { id: true; nickname: true } };
            reviewer: { select: { id: true; nickname: true } };
            skill_badges: true;
        };
    }>[]
> => {
    return await prisma.task.findMany({
        where: searchParams,
        include: {
            assignee: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
            reviewer: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
            skill_badges: true,
        },
    });
};

export const assignTaskToUser = async (userId: string, taskId: string) => {
    // Validate ID formats
    const validatedUserId = UuidSchema.parse(userId);
    const validatedTaskId = UuidSchema.parse(taskId);

    await prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
            where: {
                id: validatedTaskId,
            },
            data: {
                assignee: {
                    connect: {
                        id: validatedUserId,
                    },
                },
            },
        });
        if (!updatedTask.event_id) return;

        // Automatically give a volunteer ticket to all event volunteers

        // If the user already has any non-volunteer ticket for this event,
        // don't add/update a volunteer ticket.
        const existingNonVolunteer = await tx.eventParticipant.findFirst({
            where: {
                user_id: validatedUserId,
                ticket: {
                    event_id: updatedTask.event_id,
                    type: { not: TicketType.volunteer },
                },
            },
        });
        if (existingNonVolunteer) return;

        const volunteerTicket = await tx.ticket.findFirst({
            where: {
                event_id: updatedTask.event_id,
                type: TicketType.volunteer,
            },
        });
        if (!volunteerTicket)
            throw new Error("Volunteer ticket not found for event: " + updatedTask.event_id);

        try {
            await addEventParticipantWithTx(tx, volunteerTicket.product_id, validatedUserId);
        } catch {
            // Allow assigning task even if adding event participant fails
            // The event might be sold out.
            // Add the participant to the reserve list instead
            try {
                await addEventReserveWithTx(tx, validatedUserId, updatedTask.event_id);
            } catch {
                // Will fail if the user is already on the reserve list
            }
        }
    });
    revalidateTag(GlobalConstants.TASK);
    revalidateTag(GlobalConstants.EVENT);
};

export const unassignTaskFromUser = async (userId: string, taskId: string) => {
    // Validate ID formats
    const validatedUserId = UuidSchema.parse(userId);
    const validatedTaskId = UuidSchema.parse(taskId);

    await prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
            where: {
                id: validatedTaskId,
            },
            data: {
                assignee: {
                    disconnect: {
                        id: validatedUserId,
                    },
                },
            },
        });
        revalidateTag(GlobalConstants.TASK);

        if (!updatedTask.event_id) return;

        // The user will lose their volunteer ticket to the event if all apply:
        // - They are not host
        // - They have a volunteer ticket
        // - They are not booked for any other tasks

        const event = await tx.event.findUniqueOrThrow({
            where: {
                id: updatedTask.event_id,
            },
        });
        if (event.host_id === userId) return;

        const existingVolunteer = await tx.eventParticipant.findFirst({
            where: {
                user_id: userId,
                ticket: {
                    event_id: updatedTask.event_id,
                    type: TicketType.volunteer,
                },
            },
        });
        if (!existingVolunteer) return;

        const taskCount = await tx.task.count({
            where: {
                assignee_id: userId,
                event_id: updatedTask.event_id,
            },
        });
        if (taskCount > 0) return;

        await deleteEventParticipantWithTx(tx, updatedTask.event_id, userId);

        if (updatedTask.reviewer_id)
            try {
                await notifyTaskReviewer(
                    userId,
                    taskId,
                    "The assignee of this task has cancelled their shift.",
                );
            } catch (error) {
                // Still allow the user to unassign the task
                console.error("Error notifying task reviewer:", error);
            }
    });
};

export const contactTaskMember = async (
    recipientId: string,
    parsedFieldValues: z.infer<typeof ContactMemberSchema>,
    taskId: string | null,
): Promise<void> => {
    // Validate recipient and task ID formats
    const validatedRecipientId = UuidSchema.parse(recipientId);
    const validatedTaskId = taskId ? UuidSchema.parse(taskId) : null;
    // Revalidate input with zod schema - don't trust the client
    const validatedData = ContactMemberSchema.parse(parsedFieldValues);

    const recipient = await prisma.user.findUniqueOrThrow({
        where: {
            id: validatedRecipientId,
        },
    });
    const sender = await getLoggedInUser();
    const task = await prisma.task.findUniqueOrThrow({
        where: {
            id: validatedTaskId,
        },
    });

    await memberContactMember(
        recipient.email,
        sender.email,
        `About ${task.name}`,
        `${sender.nickname} is contacting you regarding the task ${task.name}. Please observe that your email address will be revealed if you reply to this message.`,
        validatedData.content,
    );

    // Implementation goes here
};
