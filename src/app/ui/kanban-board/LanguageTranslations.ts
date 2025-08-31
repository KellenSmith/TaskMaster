import { Language, TaskStatus } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

export const menuTabs = {
    my_tasks: "My shifts",
    filter: "Filter",
};

const LanguageTranslations = {
    assignYourselfPrompt: {
        [Language.english]: "Want to volunteer? Book a shift!",
        [Language.swedish]: "Vill du volontära? Boka in ett skift!",
    },
    printSchedule: {
        [Language.english]: "Print Schedule",
        [Language.swedish]: "Skriv ut schema",
    },
    [menuTabs.my_tasks]: {
        [Language.english]: "My shifts",
        [Language.swedish]: "Mina skift",
    },
    [menuTabs.filter]: {
        [Language.english]: "Filter",
        [Language.swedish]: "Filter",
    },
    unassigned: {
        [Language.english]: "Not booked",
        [Language.swedish]: "Ej bokat",
    },
    assigned_to_me: {
        [Language.english]: "Booked for me",
        [Language.swedish]: "Bokat för mig",
    },
    for_me_to_review: {
        [Language.english]: "Needs my feedback",
        [Language.swedish]: "Behöver min återkoppling",
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
    noShiftsBooked: {
        [Language.english]: "No volunteer shifts booked",
        [Language.swedish]: "Inga volontärskift bokade",
    },
    [GlobalConstants.STATUS]: {
        [Language.english]: "Status",
        [Language.swedish]: "Status",
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
        [Language.english]: "To Do",
        [Language.swedish]: "Att Göra",
    },
    [TaskStatus.inProgress]: {
        [Language.english]: "Being worked on",
        [Language.swedish]: "Jobbas på",
    },
    [TaskStatus.inReview]: {
        [Language.english]: "Requests feedback",
        [Language.swedish]: "Efterfrågar återkoppling",
    },
    [TaskStatus.done]: {
        [Language.english]: "Done",
        [Language.swedish]: "Klart",
    },
    addShift: {
        [Language.english]: "Add Shift",
        [Language.swedish]: "Lägg till Skift",
    },
    moreInfo: {
        [Language.english]: "More Info",
        [Language.swedish]: "Mer Info",
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
    areYouSureCancelShiftBooking: {
        [Language.english]:
            "Are you sure you want to cancel this shift booking? If you are not booked for any other shifts, you will lose your volunteer ticket.",
        [Language.swedish]:
            "Är du säker på att du vill avboka detta skift? Om du inte är bokad för några andra skift kommer du att förlora din volontärbiljett.",
    },
    cancelShiftBooking: {
        [Language.english]: "Cancel shift booking",
        [Language.swedish]: "Avboka detta skift",
    },
    areYouSureBookThisShift: {
        [Language.english]:
            "Are you sure you want to book this shift? You will get a volunteer ticket to the event. If you just want to help out but can't attend the event, please cancel your ticket in the tickets-tab above so someone else can take your spot.",
        [Language.swedish]:
            "Är du säker på att du vill boka detta skift? Du kommer få en volontärbiljett till eventet. Om du bara vill hjälpa till men inte kan delta i eventet, vänligen avsäg dig din biljett i biljett-fliken ovan så att någon annan kan få din plats.",
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
        [Language.english]: "You don't have the skills for this shift yet. Contact us to learn!",
        [Language.swedish]:
            "Du har inte färdigheterna för detta skift än. Kontakta oss för att lära dig!",
    },
};

export default LanguageTranslations;
