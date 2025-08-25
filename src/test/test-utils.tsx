import { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import ThemeContextProvider from "../app/context/ThemeContext";
import { UserContext } from "../app/context/UserContext";
import { OrganizationSettingsContext } from "../app/context/OrganizationSettingsContext";
import { Prisma } from "@prisma/client";
import testdata from "./testdata";

// Mock UserContext value
const mockUserContextValue = {
    user: testdata.user,
    language: "english",
    setLanguage: () => {},
    editMode: false,
    setEditMode: () => {},
};

// Mock OrganizationSettingsContext value
const mockOrganizationSettingsContextValue = {
    organizationSettings: {
        id: "orgsettingsid",
        organizationEmail: "test@example.com",
        organizationName: "Task Master",
        remindMembershipExpiresInDays: 7,
        purgeMembersAfterDaysUnvalidated: 180,
        defaultTaskShiftLength: 2,
        memberApplicationPrompt: "Please provide a brief introduction about yourself.",
        ticketInstructions:
            "Please include any relevant information or questions you have about the event.",
    } as Prisma.OrganizationSettingsGetPayload<true>,
};

interface WrapperProps {
    children: ReactNode;
    user?: Prisma.UserGetPayload<{
        include: { userMembership: true; userCredentials: true };
    }>;
}

// Create wrapper with mocked contexts
const AllTheProviders = ({ children, user = testdata.user }: WrapperProps) => {
    const contextValue = { ...mockUserContextValue, user };

    return (
        <OrganizationSettingsContext.Provider value={mockOrganizationSettingsContextValue}>
            <ThemeContextProvider>
                <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
            </ThemeContextProvider>
        </OrganizationSettingsContext.Provider>
    );
};

const customRender = (
    ui: ReactElement,
    { user, ...options }: { user?: typeof testdata.user } = {},
) => render(ui, { wrapper: (props) => <AllTheProviders {...props} user={user} />, ...options });

// re-export everything
export * from "@testing-library/react";
export { customRender as render };
