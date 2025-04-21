import { ReactElement } from "react";
import { render } from "@testing-library/react";
import ThemeContextProvider from "../app/context/ThemeContext";
import { UserContext } from "../app/context/UserContext";

// Mock user data for testing
export const mockUser = {
    id: "test-user-id",
    nickname: "Test User",
    email: "test@example.com",
    role: "USER",
    membershipRenewed: new Date().toISOString(),
};

// Mock UserContext value
const mockUserContextValue = {
    user: mockUser,
    logOut: vi.fn(),
    login: vi.fn(),
    updateLoggedInUser: vi.fn(),
};

interface WrapperProps {
    children: React.ReactNode;
    user?: typeof mockUser;
}

// Create wrapper with mocked contexts
const AllTheProviders = ({ children, user = mockUser }: WrapperProps) => {
    const contextValue = { ...mockUserContextValue, user };

    return (
        <ThemeContextProvider>
            <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
        </ThemeContextProvider>
    );
};

const customRender = (ui: ReactElement, { user, ...options } = {}) =>
    render(ui, { wrapper: (props) => <AllTheProviders {...props} user={user} />, ...options });

// re-export everything
export * from "@testing-library/react";
export { customRender as render };
