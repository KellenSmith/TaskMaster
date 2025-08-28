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
        // TODO: send email notification to reviewer if task goes from
        // in progress to review or from assigned to unassigned

        const oldTask = await prisma.task.findUniqueOrThrow({
            where: {
                id: taskId,
            },
        });

        const { reviewerId, assigneeId, skillBadges, ...tasksWithoutUsers } = parsedFieldValues;
        console.log(skillBadges);
        const updatedTask = await prisma.task.update({
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

        // Notify reviewer if assigned of:
        // task ready for review
        // unassigned if not status to do
        let notificationMessage = "";
        if (updatedTask.reviewerId) {
            if (
                updatedTask.status === TaskStatus.inReview &&
                oldTask.status !== TaskStatus.inReview
            ) {
                notificationMessage = `\nTask "${updatedTask.name}" is ready for review`;
            }
            if (
                !updatedTask.assigneeId &&
                oldTask.assigneeId &&
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
        const { reviewerId, assigneeId, skillBadges, ...tasksWithoutUsers } = parsedFieldValues;
        console.log(skillBadges);
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
            },
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
            skillBadges: true;
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
                skillBadges: true,
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
