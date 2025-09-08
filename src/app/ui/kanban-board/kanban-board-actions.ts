"use server";

import { createTask } from "../../lib/task-actions";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";

export async function createTaskFromKanban(
    eventId: string | null,
    language: string,
    formData: FormData,
): Promise<string> {
    console.log("createTaskFromKanban called", {
        eventId,
        formData: Object.fromEntries(formData.entries()),
    });

    try {
        await createTask(formData, eventId);
        console.log("Task created successfully");
        return GlobalLanguageTranslations.successfulSave[language];
    } catch (error) {
        console.error("Task creation failed:", error);
        throw error;
    }
}
