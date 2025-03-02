"use server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import { DatagridActionState } from "../ui/Datagrid";

export const createTasks = async (
    eventId: string,
    currentActionState: FormActionState,
    taskList: Prisma.TaskCreateInput[],
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };

    try {
        await prisma.task.createMany({
            data: taskList.map((task) => ({
                ...task,
                eventId: eventId,
            })),
        });
        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = "Created tasks";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const geteventTasks = async (
    eventId: string | null,
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const tasks = await prisma.task.findMany({
            where: {
                eventId: eventId,
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
