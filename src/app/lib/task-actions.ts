"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { DatagridActionState, FormActionState } from "./definitions";
import { revalidateTag } from "next/cache";
import z from "zod";
import { TaskCreateSchema, TaskUpdateSchema } from "./zod-schemas";

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        await prisma.task.delete({
            where: {
                id: taskId,
            },
        });
        revalidateTag(GlobalConstants.TASK);
    } catch (error) {
        throw new Error("Failed to delete task");
    }
};

export const updateTaskById = async (
    taskId: string,
    parsedFieldValues: z.infer<typeof TaskUpdateSchema>,
): Promise<void> => {
    try {
        const { reviewerId, assigneeId, eventId, ...tasksWithoutUsers } = parsedFieldValues;
        await prisma.task.update({
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
        });
        revalidateTag(GlobalConstants.TASK);
    } catch (error) {
        throw new Error("Failed to update task");
    }
};

export const createTask = async (
    parsedFieldValues: z.infer<typeof TaskCreateSchema>,
): Promise<void> => {
    try {
        const { reviewerId, assigneeId, eventId, ...tasksWithoutUsers } = parsedFieldValues;
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

export const updateEventTasks = async (
    eventId: string,
    currentActionState: FormActionState,
    taskList: Prisma.TaskCreateInput[],
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    const formattedTaskList = taskList.map((task) => {
        // Extract the IDs from the nested objects if they exist
        const reviewerId = (task.reviewer as any)?.connect?.id || null;
        const assigneeId = (task.assignee as any)?.connect?.id || null;

        return {
            ...task,
            // Set the relation fields
            reviewer: reviewerId ? { connect: { id: reviewerId } } : undefined,
            assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
        };
    });

    try {
        const existingTaskIds = (
            await prisma.task.findMany({
                where: { eventId: eventId },
                select: { id: true },
            })
        ).map((task) => task.id);

        const tasksToCreate = formattedTaskList
            .filter((task) => !existingTaskIds.includes(task[GlobalConstants.ID]))
            // Remove dummy id before creating in db and ensure eventId is set
            // eslint-disable-next-line no-unused-vars
            .map(({ id, ...restTask }) => ({
                ...restTask,
                eventId: eventId,
            }));

        const updateTasks = formattedTaskList
            .filter((task) => existingTaskIds.includes(task[GlobalConstants.ID]))
            .map((task) => {
                const { id, ...updateData } = task;
                return prisma.task.update({
                    where: { id },
                    data: updateData,
                });
            });

        // For deleteMany, only use the simple fields
        const deleteUnSelectedTasks = prisma.task.deleteMany({
            where: {
                eventId: eventId,
                id: {
                    notIn: formattedTaskList.map((task) => task[GlobalConstants.ID]),
                },
            },
        });

        await prisma.$transaction([
            deleteUnSelectedTasks,
            ...updateTasks,
            prisma.task.createMany({ data: tasksToCreate }),
        ]);

        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = "Updated tasks";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const getFilteredTasks = async (
    searchParams: Prisma.TaskWhereInput | null, // Null if fetching default tasks
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const tasks = await prisma.task.findMany({
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
            },
        });
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = tasks;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const getEventTasks = async (
    eventId: string,
): Promise<
    Prisma.TaskGetPayload<{ include: { assignee: { select: { id: true; nickname: true } } } }>[]
> => {
    try {
        return await prisma.task.findMany({
            where: {
                eventId,
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        nickname: true,
                    },
                },
            },
        });
    } catch (error) {
        throw new Error("Failed to fetch event tasks");
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
    } catch (error) {}
};
