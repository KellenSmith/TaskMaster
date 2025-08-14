import { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import ThemeContextProvider from "../app/context/ThemeContext";
import { UserContext } from "../app/context/UserContext";
import { OrganizationSettingsContext } from "../app/context/OrganizationSettingsContext";

// Mock user data for testing
export const mockUser = {
    id: "test-user-id",
    nickname: "Test User",
    email: "test@example.com",
    role: "USER",
};

// Mock UserContext value
const mockUserContextValue = {
    user: mockUser,
    logOut: vi.fn(),
    login: vi.fn(),
    updateLoggedInUser: vi.fn(),
};

// Mock OrganizationSettingsContext value
const mockOrganizationSettingsContextValue = {
    organizationSettings: {
        organizationName: "Task Master",
        remindMembershipExpiresInDays: 7,
        purgeMembersAfterDaysUnvalidated: 180,
    },
};

interface WrapperProps {
    children: ReactNode;
    user?: typeof mockUser;
}

// Create wrapper with mocked contexts
const AllTheProviders = ({ children, user = mockUser }: WrapperProps) => {
    const contextValue = { ...mockUserContextValue, user };

    return (
        <OrganizationSettingsContext.Provider value={mockOrganizationSettingsContextValue}>
            <ThemeContextProvider>
                <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
            </ThemeContextProvider>
        </OrganizationSettingsContext.Provider>
    );
};

const customRender = (ui: ReactElement, { user, ...options }: { user?: typeof mockUser } = {}) =>
    render(ui, { wrapper: (props) => <AllTheProviders {...props} user={user} />, ...options });

// re-export everything
export * from "@testing-library/react";
export { customRender as render };
