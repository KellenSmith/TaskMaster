import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import dayjs from "dayjs";
import MembershipBanner, { getDismissalKey } from "./MembershipBanner";
import { useUserContext } from "../context/UserContext";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { usePathname } from "next/navigation";
import { Language, UserStatus } from "../../prisma/generated/enums";
import LanguageTranslations from "../lib/membership-language-translations";

vi.mock("next/navigation", () => ({
    usePathname: vi.fn(() => "/"),
}));
vi.mock("../context/UserContext", () => ({
    useUserContext: vi.fn(),
}));
vi.mock("../context/OrganizationSettingsContext", () => ({
    useOrganizationSettingsContext: vi.fn(),
}));
vi.mock("./RenewMembershipButton", () => ({
    default: ({ state }: { state: string }) => <button>renew:{state}</button>,
}));

const REMIND_DAYS = 7;
const dismissLabel = LanguageTranslations.dismiss[Language.english];

const givenUser = (user: Record<string, unknown> | null) =>
    vi.mocked(useUserContext).mockReturnValue({ language: Language.english, user } as any);

const membershipExpiringIn = (days: number) => ({
    id: "user-1",
    status: UserStatus.validated,
    blacklist_entry: null,
    user_membership: {
        membership_id: "m-1",
        // One hour of slack so the truncating day-diff in getDaysUntilExpiry stays at `days`
        expires_at: dayjs.utc().add(days, "day").add(1, "hour").toDate(),
    },
});

const pendingApplicant = () => ({
    ...membershipExpiringIn(0),
    status: UserStatus.pending,
    user_membership: null,
});

const renderBanner = () => render(<MembershipBanner />);

describe("MembershipBanner", () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.mocked(usePathname).mockReturnValue("/dashboard");
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: { remind_membership_expires_in_days: REMIND_DAYS },
        } as any);
    });

    it("renders nothing for anonymous users", () => {
        givenUser(null);
        const { container } = renderBanner();
        expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing for blacklisted users", () => {
        givenUser({ ...membershipExpiringIn(-10), blacklist_entry: { id: "b-1" } });
        const { container } = renderBanner();
        expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing for active members outside the reminder window", () => {
        givenUser(membershipExpiringIn(REMIND_DAYS + 30));
        const { container } = renderBanner();
        expect(container).toBeEmptyDOMElement();
    });

    it("warns members inside the reminder window with a renew CTA", () => {
        givenUser(membershipExpiringIn(3));
        renderBanner();
        expect(screen.getByRole("alert")).toHaveTextContent(/expires in 3 days/);
        expect(screen.getByRole("button", { name: "renew:expiringSoon" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: dismissLabel })).toBeInTheDocument();
    });

    it("shows a non-dismissible error for lapsed members", () => {
        givenUser(membershipExpiringIn(-2));
        renderBanner();
        expect(screen.getByRole("alert")).toHaveTextContent(/Your membership expired on/);
        expect(screen.getByRole("button", { name: "renew:expired" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: dismissLabel })).not.toBeInTheDocument();
    });

    it("shows a non-dismissible activate prompt for approved members who never paid", () => {
        givenUser({ ...membershipExpiringIn(0), user_membership: null });
        renderBanner();
        expect(screen.getByRole("alert")).toHaveTextContent(
            LanguageTranslations.bannerAwaitingPayment[Language.english],
        );
        expect(screen.getByRole("button", { name: "renew:awaitingPayment" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: dismissLabel })).not.toBeInTheDocument();
    });

    it("shows an informational, dismissible notice for pending applicants", () => {
        givenUser(pendingApplicant());
        renderBanner();
        expect(screen.getByRole("alert")).toHaveTextContent(
            LanguageTranslations.bannerAwaitingValidation[Language.english],
        );
        expect(
            screen.getByRole("link", { name: LanguageTranslations.viewStatus[Language.english] }),
        ).toHaveAttribute("href", "/profile");
        expect(screen.getByRole("button", { name: dismissLabel })).toBeInTheDocument();
    });

    it("hides the 'view status' link when already on the profile page", () => {
        vi.mocked(usePathname).mockReturnValue("/profile");
        givenUser(pendingApplicant());
        renderBanner();
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("dismissing writes to sessionStorage keyed on the expiry date and hides the banner", async () => {
        const user = membershipExpiringIn(3);
        givenUser(user);
        renderBanner();
        await userEvent.click(screen.getByRole("button", { name: dismissLabel }));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(sessionStorage.getItem(getDismissalKey(user.user_membership.expires_at))).toBe(
            "true",
        );
    });

    it("stays hidden when already dismissed for this expiry date", () => {
        const user = membershipExpiringIn(3);
        sessionStorage.setItem(getDismissalKey(user.user_membership.expires_at), "true");
        givenUser(user);
        renderBanner();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("re-appears when the expiry date changes after a dismissal", () => {
        const previous = membershipExpiringIn(3);
        sessionStorage.setItem(getDismissalKey(previous.user_membership.expires_at), "true");
        givenUser(membershipExpiringIn(5));
        renderBanner();
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it.each(["/order?order_id=1", "/apply", "/login"])("is hidden on %s", (path) => {
        vi.mocked(usePathname).mockReturnValue(path);
        givenUser(membershipExpiringIn(-2));
        const { container } = renderBanner();
        expect(container).toBeEmptyDOMElement();
    });
});
