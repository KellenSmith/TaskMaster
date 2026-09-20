import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import MembershipBanner from "./MembershipBanner";
import { useUserContext } from "../context/UserContext";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { useNotificationContext } from "../context/NotificationContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Language, UserStatus } from "../../prisma/generated/enums";
import LanguageTranslations from "../lib/membership-language-translations";
import GlobalLanguageTranslations from "../GlobalLanguageTranslations";
import GlobalConstants from "../GlobalConstants";

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    usePathname: vi.fn(() => "/"),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));
vi.mock("../lib/membership-actions", () => ({
    startMembershipRenewal: vi.fn(),
}));
vi.mock("../context/NotificationContext", () => ({
    useNotificationContext: vi.fn(),
}));

const routerPush = vi.fn();

const createUser = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "user-1",
        status: UserStatus.validated,
        user_membership: null,
        blacklist_entry: null,
        ...overrides,
    }) as any;

// One hour of slack so the day diff is not rounded down by the milliseconds the test takes.
const membershipExpiring = (days: number) => ({
    expires_at: dayjs.utc().add(days, "day").add(1, "hour").toDate(),
});

const setUser = (user: any) =>
    vi.mocked(useUserContext).mockReturnValue({ user, language: Language.english } as any);

const closeButtonName = GlobalLanguageTranslations.close[Language.english];
const renewName = LanguageTranslations.renewMembership[Language.english];
const activateName = LanguageTranslations.activateMembership[Language.english];

describe("MembershipBanner", () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        vi.mocked(usePathname).mockReturnValue(`/${GlobalConstants.DASHBOARD}`);
        vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any);
        vi.mocked(useRouter).mockReturnValue({ push: routerPush } as any);
        vi.mocked(useNotificationContext).mockReturnValue({ addNotification: vi.fn() });
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: { remind_membership_expires_in_days: 7 },
        } as any);
        setUser(null);
    });

    describe("per membership state", () => {
        it("renders nothing for an anonymous visitor", () => {
            setUser(null);
            const { container } = render(<MembershipBanner />);
            expect(container).toBeEmptyDOMElement();
        });

        it("renders nothing for an active member outside the reminder window", () => {
            setUser(createUser({ user_membership: membershipExpiring(200) }));
            const { container } = render(<MembershipBanner />);
            expect(container).toBeEmptyDOMElement();
        });

        it("renders nothing for a blacklisted user, even one with an unexpired membership", () => {
            setUser(
                createUser({
                    user_membership: membershipExpiring(200),
                    blacklist_entry: { expires_at: null },
                }),
            );
            const { container } = render(<MembershipBanner />);
            expect(container).toBeEmptyDOMElement();
        });

        it("warns a member inside the reminder window and offers renewal", () => {
            setUser(createUser({ user_membership: membershipExpiring(3) }));
            render(<MembershipBanner />);

            const alert = screen.getByRole("alert");
            expect(alert).toHaveTextContent("Your membership expires in 3 days");
            expect(alert).toHaveTextContent(
                LanguageTranslations.renewingExtendsFromExpiry[Language.english],
            );
            expect(alert).toHaveClass("MuiAlert-colorWarning");
            expect(screen.getByRole("button", { name: renewName })).toBeInTheDocument();
        });

        it("shows a lapsed member an error with a renew CTA", () => {
            setUser(createUser({ user_membership: membershipExpiring(-2) }));
            render(<MembershipBanner />);

            const alert = screen.getByRole("alert");
            expect(alert).toHaveTextContent("Your membership expired on");
            expect(alert).toHaveTextContent(
                LanguageTranslations.renewToBookEvents[Language.english],
            );
            expect(alert).toHaveClass("MuiAlert-colorError");
            expect(screen.getByRole("button", { name: renewName })).toBeInTheDocument();
        });

        it("tells an approved-but-unpaid member to activate, as info rather than error", () => {
            setUser(createUser());
            render(<MembershipBanner />);

            const alert = screen.getByRole("alert");
            expect(alert).toHaveTextContent(
                LanguageTranslations.approvedActivatePrompt[Language.english],
            );
            expect(alert).toHaveClass("MuiAlert-colorInfo");
            expect(screen.getByRole("button", { name: activateName })).toBeInTheDocument();
        });

        it("tells a pending applicant their application is under review and links to profile", async () => {
            setUser(createUser({ status: UserStatus.pending }));
            render(<MembershipBanner />);

            const alert = screen.getByRole("alert");
            expect(alert).toHaveTextContent(
                LanguageTranslations.applicationUnderReview[Language.english],
            );
            expect(alert).toHaveClass("MuiAlert-colorInfo");

            await userEvent.click(
                screen.getByRole("button", {
                    name: LanguageTranslations.viewStatus[Language.english],
                }),
            );
            expect(routerPush).toHaveBeenCalledWith(
                expect.stringContaining(`/${GlobalConstants.PROFILE}`),
            );
        });

        it("drops the 'View status' link when the applicant is already on their profile", () => {
            vi.mocked(usePathname).mockReturnValue(`/${GlobalConstants.PROFILE}`);
            setUser(createUser({ status: UserStatus.pending }));
            render(<MembershipBanner />);

            expect(screen.getByRole("alert")).toBeInTheDocument();
            expect(
                screen.queryByRole("button", {
                    name: LanguageTranslations.viewStatus[Language.english],
                }),
            ).not.toBeInTheDocument();
        });
    });

    describe("dismissal", () => {
        it("hides the expiring-soon banner and remembers it in sessionStorage for this expiry", async () => {
            const membership = membershipExpiring(3);
            setUser(createUser({ user_membership: membership }));
            render(<MembershipBanner />);

            await userEvent.click(screen.getByRole("button", { name: closeButtonName }));

            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
            expect(
                window.sessionStorage.getItem(
                    `membership-banner-dismissed:${dayjs.utc(membership.expires_at).toISOString()}`,
                ),
            ).toBe("true");
        });

        it("stays hidden on a later render when the same expiry was already dismissed", () => {
            const membership = membershipExpiring(3);
            window.sessionStorage.setItem(
                `membership-banner-dismissed:${dayjs.utc(membership.expires_at).toISOString()}`,
                "true",
            );
            setUser(createUser({ user_membership: membership }));
            render(<MembershipBanner />);

            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        });

        it("re-shows the banner once the expiry date has changed", () => {
            window.sessionStorage.setItem(
                `membership-banner-dismissed:${dayjs.utc(membershipExpiring(3).expires_at).toISOString()}`,
                "true",
            );
            setUser(createUser({ user_membership: membershipExpiring(5) }));
            render(<MembershipBanner />);

            expect(screen.getByRole("alert")).toBeInTheDocument();
        });

        it("lets a pending applicant dismiss the review notice", async () => {
            setUser(createUser({ status: UserStatus.pending }));
            render(<MembershipBanner />);

            await userEvent.click(screen.getByRole("button", { name: closeButtonName }));

            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        });

        it("gives a lapsed member no close button", () => {
            setUser(createUser({ user_membership: membershipExpiring(-2) }));
            render(<MembershipBanner />);

            expect(screen.getByRole("alert")).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: closeButtonName })).not.toBeInTheDocument();
        });

        it("gives an approved-but-unpaid member no close button", () => {
            setUser(createUser());
            render(<MembershipBanner />);

            expect(screen.getByRole("alert")).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: closeButtonName })).not.toBeInTheDocument();
        });
    });

    describe("suppressed routes", () => {
        it.each([
            `/${GlobalConstants.ORDER}`,
            `/${GlobalConstants.ORDER}?order_id=abc`,
            `/${GlobalConstants.APPLY}`,
            `/${GlobalConstants.LOGIN}`,
        ])("renders nothing on %s even for a lapsed member", (pathname) => {
            vi.mocked(usePathname).mockReturnValue(pathname.split("?")[0]);
            setUser(createUser({ user_membership: membershipExpiring(-2) }));
            const { container } = render(<MembershipBanner />);
            expect(container).toBeEmptyDOMElement();
        });

        it("does not confuse /orders with the /order checkout page", () => {
            vi.mocked(usePathname).mockReturnValue(`/${GlobalConstants.ORDERS}`);
            setUser(createUser({ user_membership: membershipExpiring(-2) }));
            render(<MembershipBanner />);
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    describe("redirect explanation", () => {
        it("explains that the previous page needed a membership when ProtectedPage bounced the user", () => {
            vi.mocked(usePathname).mockReturnValue(`/${GlobalConstants.PROFILE}`);
            vi.mocked(useSearchParams).mockReturnValue(
                new URLSearchParams({ [GlobalConstants.MEMBERSHIP_REQUIRED]: "true" }) as any,
            );
            setUser(createUser({ user_membership: membershipExpiring(-2) }));
            render(<MembershipBanner />);

            expect(screen.getByRole("alert")).toHaveTextContent(
                LanguageTranslations.pageRequiresMembership[Language.english],
            );
        });

        it("omits the explanation when the user navigated to profile themselves", () => {
            vi.mocked(usePathname).mockReturnValue(`/${GlobalConstants.PROFILE}`);
            setUser(createUser({ user_membership: membershipExpiring(-2) }));
            render(<MembershipBanner />);

            expect(screen.getByRole("alert")).not.toHaveTextContent(
                LanguageTranslations.pageRequiresMembership[Language.english],
            );
        });
    });
});
