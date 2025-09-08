"use server";

import { createTask } from "../../lib/task-actions";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../../GlobalConstants";

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
        userAgent: "server-action",
    });

    try {
        console.log("SERVER ACTION: About to call createTask");
        await createTask(formData, eventId);
        console.log("SERVER ACTION: Task created successfully");

        // Ensure we revalidate the correct tags
        revalidateTag(GlobalConstants.TASK);
        if (eventId) {
            revalidateTag(GlobalConstants.EVENT);
        }

        // Return success message in the correct language
        const successMessage =
            GlobalLanguageTranslations.successfulSave[language] ||
            GlobalLanguageTranslations.successfulSave["english"] ||
            "Task saved successfully";

        console.log("SERVER ACTION: Returning success:", successMessage);
        return successMessage;
    } catch (error) {
        console.error("SERVER ACTION: Task creation failed:", error);
        console.error("SERVER ACTION: Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            eventId,
            language,
        });
        throw error;
    }
}

// Create separate server actions to avoid parameter binding issues
export async function createEventTask(
    eventId: string,
    language: string,
    formData: FormData,
): Promise<string> {
    console.log("SERVER ACTION: createEventTask called", {
        eventId,
        language,
        formData: Object.fromEntries(formData.entries()),
        timestamp: new Date().toISOString(),
    });

    return createTaskFromKanban(eventId, language, formData);
}

export async function createStandaloneTask(language: string, formData: FormData): Promise<string> {
    console.log("SERVER ACTION: createStandaloneTask called", {
        language,
        formData: Object.fromEntries(formData.entries()),
        timestamp: new Date().toISOString(),
    });

    return createTaskFromKanban(null, language, formData);
}
