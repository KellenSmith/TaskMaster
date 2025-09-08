"use server";

import { createTaskFromKanban } from "./kanban-board-actions";

// Wrapper function to ensure proper server action binding
export async function createTaskWrapper(
    eventId: string | null,
    language: string,
    formData: FormData,
): Promise<string> {
    console.log("WRAPPER: createTaskWrapper called", {
        eventId,
        language,
        formDataEntries: Object.fromEntries(formData.entries()),
    });

    return await createTaskFromKanban(eventId, language, formData);
}
