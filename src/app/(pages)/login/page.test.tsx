import { render, screen } from "@testing-library/react";
import { clientRedirect } from "../../lib/utils";
import LoginPage from "./page";
import userEvent from "@testing-library/user-event";
import { login } from "../../lib/user-actions";
import NotificationContextProvider from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";

vi.mock("../../lib/utils", () => ({
    clientRedirect: vi.fn(),
}));
vi.mock("../../lib/user-actions", () => ({
    login: vi.fn(),
}));

const renderLoginPage = () =>
    render(
        <NotificationContextProvider>
            <LoginPage />
        </NotificationContextProvider>,
    );

const testEmail = "email@example.com";
const testFormData = new FormData();
testFormData.append("email", testEmail);

describe("LoginPage", () => {
    it("reroutes to apply page when button is clicked", async () => {
        renderLoginPage();

        const applyButton = screen.getByRole("button", { name: /apply for membership/i });
        await userEvent.click(applyButton);
        expect(vi.mocked(clientRedirect)).toHaveBeenCalledWith(expect.anything(), ["apply"]);
    });
    it("calls login action with form data when form is submitted", async () => {
        renderLoginPage();

        const emailInput = screen.getByRole("textbox", { name: /email/i });
        await userEvent.type(emailInput, testEmail);
        const submitButton = screen.getByRole("button", { name: /login/i });
        await userEvent.click(submitButton);
        expect(vi.mocked(login)).toHaveBeenCalledWith(testFormData);
    });
    it("displays error message when login fails", async () => {
        vi.mocked(login).mockRejectedValueOnce(new Error("Login failed"));

        renderLoginPage();

        const emailInput = screen.getByRole("textbox", { name: /email/i });
        await userEvent.type(emailInput, testEmail);
        const submitButton = screen.getByRole("button", { name: /login/i });
        await userEvent.click(submitButton);
        expect(await screen.findByText(/failed to log in/i)).toBeInTheDocument();
    });
    it("renders swedish translations when language is set to swedish", () => {
        vi.mocked(useUserContext).mockReturnValue({ language: "swedish" } as any);

        renderLoginPage();

        expect(screen.getByRole("button", { name: /logga in/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /ansök om medlemskap/i })).toBeInTheDocument();
    });
});
