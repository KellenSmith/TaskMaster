"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { DatagridActionState } from "../ui/Datagrid";
import GlobalConstants from "../GlobalConstants";
import { FormActionState } from "./definitions";

export const deleteTask = async (taskId: string, currentActionState: FormActionState) => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.task.delete({
            where: {
                id: taskId,
            },
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Deleted task";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const updateTaskById = async (
    taskId: string,
    currentActionState: FormActionState,
    newTaskData: Prisma.TaskUpdateInput,
) => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.task.update({
            where: {
                id: taskId,
            },
            data: newTaskData,
        });
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Updated task";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const createTask = async (
    currentActionState: FormActionState,
    fieldValues: Prisma.TaskCreateInput,
) => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.task.create({
            data: fieldValues,
        });
        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = "Created task";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const updateEventTasks = async (
    eventId: string,
    currentActionState: FormActionState,
    taskList: Prisma.TaskCreateInput[],
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    const formattedTaskList = taskList.map((task) => {
        // Extract the IDs from the nested objects if they exist
        const reporterId = (task.Reporter as any)?.connect?.id || null;
        const assigneeId = (task.Assignee as any)?.connect?.id || null;

        return {
            ...task,
            // Set the relation fields
            Reporter: reporterId ? { connect: { id: reporterId } } : undefined,
            Assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
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
                Assignee: {
                    select: {
                        id: true,
                        nickname: true,
                    },
                },
                Reporter: {
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

export const assignTasksToUser = async (
    userId: string,
    taskIds: string[],
    currentActionState: FormActionState,
) => {
    const newActionState = { ...currentActionState };
    try {
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                assignedTasks: {
                    connect: taskIds.map((taskId) => ({
                        id: taskId,
                    })),
                },
            },
        });
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = "Assigned tasks";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};
