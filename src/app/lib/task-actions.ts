"use server";

import { Prisma, TaskStatus, TicketType } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import z from "zod";
import { TaskCreateSchema, TaskUpdateSchema } from "./zod-schemas";
import { notifyTaskReviewer } from "./mail-service/mail-service";
import {
    addEventParticipantWithTx,
    deleteEventParticipantWithTx,
} from "./event-participant-actions";
import { addEventReserveWithTx } from "./event-reserve-actions";

export const deleteTask = async (taskId: string): Promise<void> => {
    await prisma.task.delete({
        where: {
            id: taskId,
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
    return await prisma.task.findUniqueOrThrow({
        where: {
            id: taskId,
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
    const oldTask = await prisma.task.findUniqueOrThrow({
        where: {
            id: taskId,
        },
    });

    const {
        reviewer_id: reviewerId,
        assignee_id: assigneeId,
        skill_badges: newSkillBadges,
        ...taskWithoutUsers
    } = parsedFieldValues;

    await prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
            where: {
                id: taskId,
            },
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
                ...(eventId && {
                    event: {
                        connect: {
                            id: eventId,
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
    const {
        assignee_id: assigneeId,
        reviewer_id: reviewerId,
        skill_badges: skillBadges,
        ...taskWithoutUsers
    } = parsedFieldValues;

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
            ...(eventId && {
                event: {
                    connect: {
                        id: eventId,
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
    await prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
            where: {
                id: taskId,
            },
            data: {
                assignee: {
                    connect: {
                        id: userId,
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
                user_id: userId,
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
            await addEventParticipantWithTx(tx, volunteerTicket.id, userId);
        } catch {
            // Allow assigning task even if adding event participant fails
            // The event might be sold out.
            // Add the participant to the reserve list instead
            try {
                await addEventReserveWithTx(tx, userId, updatedTask.event_id);
            } catch {
                // Will fail if the user is already on the reserve list
            }
        }
    });
    revalidateTag(GlobalConstants.TASK);
    revalidateTag(GlobalConstants.EVENT);
};

export const unassignTaskFromUser = async (userId: string, taskId: string) => {
    await prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
            where: {
                id: taskId,
            },
            data: {
                assignee: {
                    disconnect: {
                        id: userId,
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
