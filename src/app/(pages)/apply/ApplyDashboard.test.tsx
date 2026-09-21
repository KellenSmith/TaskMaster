import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Language } from "../../../prisma/generated/enums";
import { submitMemberApplication } from "../../lib/user-actions";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import z from "zod";
import { MembershipApplicationSchema } from "../../lib/zod-schemas";
import NotificationContextProvider from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import ApplyDashboard from "./ApplyDashboard";
import LanguageTranslations from "./LanguageTranslations";

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
    // A successful action resolves to undefined per the server-action conventions
    submitMemberApplication: vi.fn(async () => undefined),
}));
// Both read promises from context; their own tests cover them
vi.mock("../../ui/MembershipStepper", () => ({
    default: ({ activeStep }: { activeStep: number }) => (
        <div data-testid="membership-stepper">step:{activeStep}</div>
    ),
}));
vi.mock("../../ui/TextContent", () => ({
    default: () => <div data-testid="text-content">What happens next</div>,
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
            <ApplyDashboard textContentPromise={Promise.resolve({} as any)} />
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

const privacyCheckbox = () => screen.getByRole("checkbox", { name: /privacy policy/i });
const termsCheckbox = () => screen.getByRole("checkbox", { name: /terms of membership/i });
const submitButton = () => screen.getByRole("button", { name: /submit application/i });

describe("ApplyPage", () => {
    beforeEach(() => {
        vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), refresh: vi.fn() } as any);
    });

    it("shows the whole process and the organization's text before the form", () => {
        renderApplyPage();
        expect(screen.getByTestId("membership-stepper")).toHaveTextContent("step:0");
        expect(screen.getByTestId("text-content")).toBeInTheDocument();
    });

    it("accepts typing before the terms are ticked", () => {
        renderApplyPage();
        expect(screen.getByRole("textbox", { name: /first name/i })).toBeEnabled();
        expect(privacyCheckbox()).not.toBeChecked();
    });

    it("refuses to submit until the terms are accepted, without calling the action", async () => {
        renderApplyPage();
        await fillOutForm(formData);
        await userEvent.click(submitButton());
        expect(
            await screen.findByText(LanguageTranslations.termsRequired[Language.english]),
        ).toBeInTheDocument();
        expect(submitMemberApplication).not.toHaveBeenCalled();
        expect(submitButton()).toBeInTheDocument();
    });

    it("submits and replaces the form with an inline confirmation at step 2", async () => {
        renderApplyPage();
        await fillOutForm(formData);
        await userEvent.click(privacyCheckbox());
        await userEvent.click(submitButton());

        expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(formData.email as string))).toBeInTheDocument();
        expect(screen.getByText(/check your spam folder/i)).toBeInTheDocument();
        expect(screen.getByTestId("membership-stepper")).toHaveTextContent("step:1");
        expect(
            screen.queryByRole("button", { name: /submit application/i }),
        ).not.toBeInTheDocument();
    });

    it("renders a terms of membership checkbox when the organization has a URL configured", async () => {
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: {
                id: "org-1",
                terms_of_membership_english_url: "https://example.com/terms",
            },
        } as any);

        renderApplyPage();

        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(2);
        expect(links[0]).toHaveTextContent(/terms of membership/i);
        expect(links[0]).toHaveAttribute("href", "https://example.com/terms");
        expect(links[1]).toHaveTextContent(/privacy policy/i);
        expect(links[1]).toHaveAttribute("href", "documents/privacy-policy-english.pdf");
        for (const link of links) {
            expect(link).toHaveAttribute("target", "_blank");
            expect(link).toHaveAttribute("rel", "noopener noreferrer");
        }

        // Both must be ticked
        await fillOutForm(formData);
        await userEvent.click(privacyCheckbox());
        await userEvent.click(submitButton());
        expect(
            await screen.findByText(LanguageTranslations.termsRequired[Language.english]),
        ).toBeInTheDocument();
        expect(submitMemberApplication).not.toHaveBeenCalled();

        await userEvent.click(termsCheckbox());
        await userEvent.click(submitButton());
        expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
    });

    it("shows the error inline and keeps the form when submission fails", async () => {
        vi.mocked(submitMemberApplication).mockRejectedValueOnce(new Error("Submission failed"));

        renderApplyPage();
        await fillOutForm(formData);
        await userEvent.click(privacyCheckbox());
        await userEvent.click(submitButton());
        // Exactly one message: inline, not duplicated as a toast
        expect(await screen.findAllByText(/failed to submit application/i)).toHaveLength(1);
        expect(submitButton()).toBeInTheDocument();
    });

    it("shows a localized error returned by the action inline", async () => {
        vi.mocked(submitMemberApplication).mockResolvedValueOnce("Nickname already exists");

        renderApplyPage();
        await fillOutForm(formData);
        await userEvent.click(privacyCheckbox());
        await userEvent.click(submitButton());
        expect(await screen.findByText(/nickname already exists/i)).toBeInTheDocument();
        expect(screen.queryByText(/application submitted/i)).not.toBeInTheDocument();
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
        expect(screen.getByRole("textbox", { name: /motivation/i })).toBeRequired();
    });

    it("renders swedish translations when user language is set to swedish", () => {
        vi.mocked(useUserContext).mockReturnValue({ language: Language.swedish } as any);

        renderApplyPage();

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
