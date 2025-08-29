import { Language, TaskStatus } from "@prisma/client";

const LanguageTranslations = {
    assignYourselfPrompt: {
        [Language.english]: "Assign yourself to tasks and shifts to help make the event happen",
        [Language.swedish]:
            "Tilldela dig själv uppgifter och skift för att hjälpa till att få evenemanget att hända",
    },
    printSchedule: {
        [Language.english]: "Print Schedule",
        [Language.swedish]: "Skriv ut schema",
    },
    openFilter: {
        [Language.english]: "Open Filter",
        [Language.swedish]: "Öppna filter",
    },
    unassigned: {
        [Language.english]: "Unassigned",
        [Language.swedish]: "Ej tilldelad",
    },
    assigned_to_me: {
        [Language.english]: "Assigned to Me",
        [Language.swedish]: "Tilldelad till mig",
    },
    for_me_to_review: {
        [Language.english]: "For Me to Review",
        [Language.swedish]: "För mig att granska",
    },
    begins_after: {
        [Language.english]: "Begins After",
        [Language.swedish]: "Börjar Efter",
    },
    ends_before: {
        [Language.english]: "Ends Before",
        [Language.swedish]: "Slutar Före",
    },
    has_tag: {
        [Language.english]: "Has Tag",
        [Language.swedish]: "Har tagg",
    },
    apply: {
        [Language.english]: "Apply",
        [Language.swedish]: "Tillämpa",
    },
    clear: {
        [Language.english]: "Clear",
        [Language.swedish]: "Rensa",
    },
    taskSetTo: {
        [Language.english]: "Task set to",
        [Language.swedish]: "Uppgift satt till",
    },
    [TaskStatus.toDo]: {
        [Language.english]: "To Do",
        [Language.swedish]: "Att Göra",
    },
    [TaskStatus.inProgress]: {
        [Language.english]: "In Progress",
        [Language.swedish]: "Pågår",
    },
    [TaskStatus.inReview]: {
        [Language.english]: "In Review",
        [Language.swedish]: "Under Granskning",
    },
    [TaskStatus.done]: {
        [Language.english]: "Done",
        [Language.swedish]: "Klar",
    },
    addShift: {
        [Language.english]: "Add Shift",
        [Language.swedish]: "Lägg till Skift",
    },
    shifts: {
        [Language.english]: "Shifts",
        [Language.swedish]: "Skift",
    },
};

export default LanguageTranslations;
