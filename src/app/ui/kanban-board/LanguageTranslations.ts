import { Language, TaskStatus } from "@prisma/client";

const LanguageTranslations = {
    assignYourselfPrompt: {
        [Language.english]: "Want to volunteer? Book a shift!",
        [Language.swedish]: "Vill du volontära? Boka in ett skift!",
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
        [Language.english]: "Moved to",
        [Language.swedish]: "Flyttad till",
    },
    [TaskStatus.toDo]: {
        [Language.english]: "Bookable shifts",
        [Language.swedish]: "Bokningsbara skift",
    },
    [TaskStatus.inProgress]: {
        [Language.english]: "Booked shifts",
        [Language.swedish]: "Bokade skift",
    },
    [TaskStatus.inReview]: {
        [Language.english]: "Requests feedback",
        [Language.swedish]: "Efterfrågar återkoppling",
    },
    [TaskStatus.done]: {
        [Language.english]: "Done/Finished",
        [Language.swedish]: "Klar/Avslutat",
    },
    addShift: {
        [Language.english]: "Add Shift",
        [Language.swedish]: "Lägg till Skift",
    },
    shifts: {
        [Language.english]: "Shifts",
        [Language.swedish]: "Skift",
    },
    filtrationError: {
        [Language.english]: "Error applying filters",
        [Language.swedish]: "Kunde inte tillämpa filter",
    },
    bookedTask: {
        [Language.english]: "Volunteer shift booked",
        [Language.swedish]: "Volontärskift bokat",
    },
    failedBookTask: {
        [Language.english]: "Failed to book volunteer shift",
        [Language.swedish]: "Kunde inte boka volontärskift",
    },
    cancelShiftBooking: {
        [Language.english]: "Cancel shift booking",
        [Language.swedish]: "Avboka detta skift",
    },
    bookThisShift: {
        [Language.english]: "Book this shift",
        [Language.swedish]: "Boka detta skift",
    },
    unassignedTask: {
        [Language.english]: "Cancelled booked volunteer shift",
        [Language.swedish]: "Avbokade bokat volontärskift",
    },
    failedUnassignTask: {
        [Language.english]: "Failed to cancel booked volunteer shift",
        [Language.swedish]: "Kunde inte avboka bokat volontärskift",
    },
    unqualifiedForShift: {
        [Language.english]: "You don't have the skills for this shift yet",
        [Language.swedish]: "Du har inte färdigheterna för detta skift än",
    },
};

export default LanguageTranslations;
