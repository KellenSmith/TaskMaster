"use server";

import { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import z from "zod";
import { TaskCreateSchema, TaskUpdateSchema } from "./zod-schemas";
import { notifyTaskReviewer } from "./mail-service/mail-service";

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        await prisma.task.delete({
            where: {
                id: taskId,
            },
        });
        revalidateTag(GlobalConstants.TASK);
    } catch {
        throw new Error("Failed to delete task");
    }
};

export const updateTaskById = async (
    taskId: string,
    parsedFieldValues: z.infer<typeof TaskUpdateSchema>,
    eventId: string | null,
): Promise<void> => {
    try {
        const oldTask = await prisma.task.findUniqueOrThrow({
            where: {
                id: taskId,
            },
        });

        const {
            reviewer_id: reviewerId,
            assignee_id: assigneeId,
            skill_badges: newSkillBadges,
            ...tasksWithoutUsers
        } = parsedFieldValues;

        await prisma.$transaction(async (tx) => {
            const updatedTask = await tx.task.update({
                where: {
                    id: taskId,
                },
                data: {
                    ...tasksWithoutUsers,
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
    } catch {
        throw new Error("Failed to update task");
    }
};

export const createTask = async (
    parsedFieldValues: z.infer<typeof TaskCreateSchema>,
    eventId: string | null,
): Promise<void> => {
    try {
        const {
            assignee_id: assigneeId,
            reviewer_id: reviewerId,
            skill_badges: skillBadges,
            ...tasksWithoutUsers
        } = parsedFieldValues;
        await prisma.task.create({
            data: {
                ...tasksWithoutUsers,
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
    } catch {
        throw new Error("Failed to create task");
    }
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
    try {
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
    } catch {
        throw new Error("Failed to fetch tasks");
    }
};

export const assignTaskToUser = async (userId: string, taskId: string) => {
    try {
        await prisma.task.update({
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
        revalidateTag(GlobalConstants.TASK);
    } catch {
        throw new Error("Failed to assign task");
    }
};
