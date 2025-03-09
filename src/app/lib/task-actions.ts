"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import { DatagridActionState } from "../ui/Datagrid";

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

export const updateEventTasks = async (
    eventId: string,
    currentActionState: FormActionState,
    taskList: Prisma.TaskCreateInput[],
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };

    try {
        const tasksToCreate = taskList
            .filter((task) => !task.id)
            .map((task) => ({
                ...task,
                eventId: eventId,
            }));

        const updateTasks = taskList
            .filter((task) => task.id)
            .map((task) =>
                prisma.task.update({
                    where: { id: task.id },
                    data: task,
                }),
            );

        const taskIds = taskList.map((task) => task.id).filter((id) => id !== undefined);
        const deleteUnSelectedTasks = prisma.task.deleteMany({
            where: {
                eventId: eventId,
                id: {
                    notIn: taskIds,
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

export const getEventTasks = async (
    searchParams: Prisma.TaskWhereInput | null, // Null if fetching default tasks
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const tasks = await prisma.task.findMany({
            where: searchParams,
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
