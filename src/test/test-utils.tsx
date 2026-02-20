import { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import ThemeContextProvider from "../app/context/ThemeContext";
import { UserContext } from "../app/context/UserContext";
import { OrganizationSettingsContext } from "../app/context/OrganizationSettingsContext";
import testdata from "./testdata";
import { Language } from "../prisma/generated/enums";
import { Prisma } from "../prisma/generated/client";

// Mock UserContext value
const mockUserContextValue = {
    user: testdata.user,
    language: Language.english,
    setLanguage: () => {},
    editMode: false,
    setEditMode: () => {},
};

// Mock OrganizationSettingsContext value
const mockOrganizationSettingsContextValue = {
    organizationSettings: {
        id: "orgsettingsid",
        remind_membership_expires_in_days: 7,
        purge_members_after_days_unvalidated: 180,
        default_task_shift_length: 2,
        member_application_prompt: "Please provide a brief introduction about yourself.",
        ticket_instructions:
            "Please include any relevant information or questions you have about the event.",
    } as Prisma.OrganizationSettingsGetPayload<true>,
    infopagesPromise: Promise.resolve([]),
};

interface WrapperProps {
    children: ReactNode;
    user?: Prisma.UserGetPayload<{
        include: { user_membership: true; skill_badges: true };
    }>;
    language?: Language;
}

// Create wrapper with mocked contexts
const AllTheProviders = ({
    children,
    user = testdata.user,
    language = Language.english,
}: WrapperProps) => {
    const contextValue = { ...mockUserContextValue, user, language };

    return (
        <OrganizationSettingsContext.Provider value={mockOrganizationSettingsContextValue}>
            <ThemeContextProvider>
                <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
            </ThemeContextProvider>
        </OrganizationSettingsContext.Provider>
    );
};

export const customRender = (
    ui: ReactElement,
    { user, language, ...options }: { user?: typeof testdata.user; language?: Language } = {},
) =>
    render(ui, {
        wrapper: (props) => <AllTheProviders {...props} user={user} language={language} />,
        ...options,
    });
