"use server";

import { createTask } from "../../lib/task-actions";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";

export async function createTaskFromKanban(
    eventId: string | null,
    language: string,
    formData: FormData,
): Promise<string> {
    console.log("SERVER ACTION: createTaskFromKanban called", {
        eventId,
        language,
        formData: Object.fromEntries(formData.entries()),
        timestamp: new Date().toISOString(),
    });

    try {
        console.log("SERVER ACTION: About to call createTask");
        await createTask(formData, eventId);
        console.log("SERVER ACTION: Task created successfully");
        return GlobalLanguageTranslations.successfulSave[language];
    } catch (error) {
        console.error("SERVER ACTION: Task creation failed:", error);
        throw error;
    }
}
