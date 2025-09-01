import { Language, UserRole } from "@prisma/client";
import GlobalConstants from "../GlobalConstants";

const LanguageTranslations = {
    failedToLogOut: {
        [Language.english]: "Failed to log out",
        [Language.swedish]: "Kunde inte logga ut",
    },
    restrictedRoute: {
        [UserRole.member]: {
            [Language.english]: "Members only",
            [Language.swedish]: "För medlemmar",
        },
        [UserRole.admin]: {
            [Language.english]: "Admins only",
            [Language.swedish]: "För administratörer",
        },
    },
    routeLabel: {
        [GlobalConstants.APPLY]: {
            [Language.english]: "Apply",
            [Language.swedish]: "Ansök",
        },
        [GlobalConstants.CONTACT]: {
            [Language.english]: "Contact",
            [Language.swedish]: "Kontakt",
        },
        [GlobalConstants.PROFILE]: {
            [Language.english]: "Profile",
            [Language.swedish]: "Profil",
        },
        [GlobalConstants.CALENDAR]: {
            [Language.english]: "Calendar",
            [Language.swedish]: "Kalender",
        },
        [GlobalConstants.LOCATIONS]: {
            [Language.english]: "Locations",
            [Language.swedish]: "Lokaler",
        },
        [GlobalConstants.TASKS]: {
            [Language.english]: "To do",
            [Language.swedish]: "Att göra",
        },
        [GlobalConstants.YEAR_WHEEL]: {
            [Language.english]: "Year Wheel",
            [Language.swedish]: "Årshjul",
        },
        [GlobalConstants.SKILL_BADGES]: {
            [Language.english]: "Skill Badges",
            [Language.swedish]: "Kompetensdiplom",
        },
        [GlobalConstants.SENDOUT]: {
            [Language.english]: "Sendout",
            [Language.swedish]: "Utskick",
        },
        [GlobalConstants.MEMBERS]: {
            [Language.english]: "Members",
            [Language.swedish]: "Medlemmar",
        },
        [GlobalConstants.PRODUCTS]: {
            [Language.english]: "Products",
            [Language.swedish]: "Produkter",
        },
        [GlobalConstants.ORDERS]: {
            [Language.english]: "Orders",
            [Language.swedish]: "Beställningar",
        },
        [GlobalConstants.ORGANIZATION_SETTINGS]: {
            [Language.english]: "Settings",
            [Language.swedish]: "Inställningar",
        },
    },
    toggleAdminEditMode: {
        [Language.english]: (editMode: boolean) =>
            `${editMode ? "Disable" : "Enable"} admin edit mode`,
        [Language.swedish]: (editMode: boolean) =>
            `${editMode ? "Slå av" : "Aktivera"} redigeringsläge som administratör`,
    },
    toggleLoggedIn: {
        [Language.english]: (loggedIn: boolean) => (loggedIn ? "Log out" : "Log in"),
        [Language.swedish]: (loggedIn: boolean) => (loggedIn ? "Logga ut" : "Logga in"),
    },
    errorInField: {
        [Language.english]: "Error in field",
        [Language.swedish]: "Fel i fältet",
    },
    confirm: {
        [Language.english]: "Confirm",
        [Language.swedish]: "Bekräfta",
    },
    areYouSure: {
        [Language.english]: "Are you sure?",
        [Language.swedish]: "Är du säker?",
    },
    proceed: {
        [Language.english]: "Proceed",
        [Language.swedish]: "Fortsätt",
    },
    addNew: {
        [Language.english]: "Add New",
        [Language.swedish]: "Lägg till ny",
    },
};

export default LanguageTranslations;
