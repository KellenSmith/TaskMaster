import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApplyPage from "./page";
import { Language } from "../../../prisma/generated/enums";
import { submitMemberApplication } from "../../lib/user-actions";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import z from "zod";
import { MembershipApplicationSchema } from "../../lib/zod-schemas";
import NotificationContextProvider from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";

vi.mock("../../context/UserContext", () => ({
    useUserContext: vi.fn(() => ({
        language: Language.english,
    })),
}));
vi.mock("../../context/OrganizationSettingsContext", () => ({
    useOrganizationSettingsContext: vi.fn(() => ({
        organizationSettings: {
            id: "org-1",
        },
    })),
}));
vi.mock("../../lib/user-actions", () => ({
    submitMemberApplication: vi.fn(
        async () => "Application submitted. A login link will arrive in your email shortly.",
    ),
}));

const formData: Partial<z.infer<typeof MembershipApplicationSchema>> = {
    first_name: "John",
    sur_name: "Smith",
    email: "john.doe@example.com",
    nickname: "Johnny",
};

const fieldLabels = {
    first_name: /first name/i,
    sur_name: /surname/i,
    nickname: /nickname/i,
    email: /email/i,
    pronoun: /pronoun/i,
    phone: /phone/i,
};

const renderApplyPage = () =>
    render(
        <NotificationContextProvider>
            <ApplyPage />
        </NotificationContextProvider>,
    );

const fillOutForm = async (fieldValues: typeof formData) => {
    for (const field of Object.keys(fieldValues)) {
        const input = screen.getByRole("textbox", {
            name: new RegExp(fieldLabels[field as keyof typeof fieldLabels], "i"),
        });
        await userEvent.type(input, fieldValues[field as keyof typeof fieldLabels] as string);
    }
    const gdprCheckbox = screen.getByRole("checkbox", {
        name: /i consent to being added to the member registry/i,
    });
    await userEvent.click(gdprCheckbox);
};

describe("ApplyPage", () => {
    it("submits the membership application with default organization settings", async () => {
        renderApplyPage();

        // Form is disabled before accepting terms
        const firstNameInput = screen.getByRole("textbox", { name: /first name/i });
        expect(firstNameInput).toBeDisabled();

        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBe(3);

        // Click privacy checkbox to accept terms
        await userEvent.click(checkboxes[0]);

        // Fill out form fields
        await fillOutForm(formData);

        // Click submit and wait for success notification
        const submitButton = await screen.findByRole("button", { name: /submit application/i });
        await userEvent.click(submitButton);
        expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
    });
    it("renders terms of membership section if there is an URL configured in organization settings", async () => {
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: {
                id: "org-1",
                terms_of_membership_english_url: "https://example.com/terms",
            },
        } as any);

        renderApplyPage();

        const checkboxes = screen.getAllByRole("checkbox");
        const checkboxLabels = screen.getAllByText(/i have read/i);
        expect(checkboxes.length).toBe(4);
        expect(checkboxLabels.length).toBe(2);

        expect(screen.getByText(/terms of membership/i)).toBeInTheDocument();
        expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();

        const links = screen.getAllByRole("link");
        expect(links.length).toBe(2);
        expect(links[0]).toHaveTextContent(/terms of membership/i);
        expect(links[0]).toHaveAttribute("href", "https://example.com/terms");
        expect(links[1]).toHaveTextContent(/privacy policy/i);
        expect(links[1]).toHaveAttribute("href", "documents/privacy-policy-english.pdf");

        for (const link of links) {
            expect(link).toHaveAttribute("target", "_blank");
            expect(link).toHaveAttribute("rel", "noopener noreferrer");
        }

        await userEvent.click(checkboxes[0]);
        await userEvent.click(checkboxes[1]);
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();

        await fillOutForm(formData);

        const submitButton = screen.getByRole("button", { name: /submit application/i });
        await userEvent.click(submitButton);
        expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
    });
    it("shows error notification when application submission fails", async () => {
        vi.mocked(submitMemberApplication).mockRejectedValueOnce(new Error("Submission failed"));

        renderApplyPage();

        const checkboxes = screen.getAllByRole("checkbox");
        await userEvent.click(checkboxes[0]);
        await fillOutForm(formData);
        const submitButton = screen.getByRole("button", { name: /submit application/i });
        await userEvent.click(submitButton);
        expect(await screen.findByText(/failed to submit application/i)).toBeInTheDocument();
    });
    it("takes an application prompt from organization settings and displays it", async () => {
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: {
                id: "org-1",
                member_application_prompt: "Why do you want to join?",
            },
        } as any);

        renderApplyPage();

        expect(screen.getByText(/why do you want to join\?/i)).toBeInTheDocument();
        const applicationPromptInput = screen.getByRole("textbox", {
            name: /motivation/i,
        });
        expect(applicationPromptInput).toBeRequired();
    });
    it("renders swedish translations when user language is set to swedish", () => {
        vi.mocked(useUserContext).mockReturnValue({ language: Language.swedish } as any);

        renderApplyPage();

        // Check that all text content is in swedish
        expect(screen.getByText(/se till att du har läst/i)).toBeInTheDocument();
        expect(screen.getByText(/jag har läst/i)).toBeInTheDocument();
        expect(screen.getByText(/integritetspolicy/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/förnamn/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/efternamn/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/smeknamn/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/e-post/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/pronomen/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/telefon/i)).toBeInTheDocument();
    });
});
