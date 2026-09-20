import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import AccountTab from "./AccountTab";
import { useUserContext } from "../../context/UserContext";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { useNotificationContext } from "../../context/NotificationContext";
import { useRouter } from "next/navigation";
import { Language, UserRole, UserStatus } from "../../../prisma/generated/enums";
import MembershipLanguageTranslations from "../../lib/membership-language-translations";
import GlobalConstants from "../../GlobalConstants";

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({ push: vi.fn() })),
}));
vi.mock("../../ui/form/Form", () => ({
    default: () => <div data-testid="profile-form" />,
}));
vi.mock("./MembershipStatusCard", () => ({
    default: () => <div data-testid="membership-status-card" />,
}));
vi.mock("../../lib/user-actions", () => ({
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    logOut: vi.fn(),
}));
vi.mock("../../lib/membership-actions", () => ({
    startMembershipRenewal: vi.fn(),
}));
vi.mock("../../context/NotificationContext", () => ({
    useNotificationContext: vi.fn(),
}));

const routerPush = vi.fn();

const createUser = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "user-1",
        role: UserRole.member,
        status: UserStatus.validated,
        user_membership: null,
        blacklist_entry: null,
        ...overrides,
    }) as any;

const membershipExpiring = (days: number) => ({
    expires_at: dayjs.utc().add(days, "day").add(1, "hour").toDate(),
});

const renderTab = (user: any) => {
    vi.mocked(useUserContext).mockReturnValue({ user, language: Language.english } as any);
    render(<AccountTab membershipProductPromise={Promise.resolve(null)} />);
};

const en = Language.english;
const renewName = MembershipLanguageTranslations.renewMembership[en];
const activateName = MembershipLanguageTranslations.activateMembership[en];
const browseName = MembershipLanguageTranslations.browseOtherMemberships[en];

describe("AccountTab membership CTAs", () => {
    beforeEach(() => {
        vi.mocked(useRouter).mockReturnValue({ push: routerPush } as any);
        vi.mocked(useNotificationContext).mockReturnValue({ addNotification: vi.fn() });
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: { remind_membership_expires_in_days: 7 },
        } as any);
    });

    it("offers only the shop link to an active member with nothing to renew", () => {
        renderTab(createUser({ user_membership: membershipExpiring(200) }));

        expect(screen.queryByRole("button", { name: renewName })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: browseName })).toBeInTheDocument();
    });

    it("offers renewal inside the reminder window", () => {
        renderTab(createUser({ user_membership: membershipExpiring(3) }));

        expect(screen.getByRole("button", { name: renewName })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: browseName })).toBeInTheDocument();
    });

    it("offers renewal after the membership lapsed", () => {
        renderTab(createUser({ user_membership: membershipExpiring(-2) }));

        expect(screen.getByRole("button", { name: renewName })).toBeInTheDocument();
    });

    it("offers activation to an approved member who never paid", () => {
        renderTab(createUser());

        expect(screen.getByRole("button", { name: activateName })).toBeInTheDocument();
    });

    it("offers nothing to buy while the application is under review", () => {
        renderTab(createUser({ status: UserStatus.pending }));

        expect(screen.queryByRole("button", { name: renewName })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: activateName })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: browseName })).not.toBeInTheDocument();
    });

    it("offers nothing to buy to a blacklisted user", () => {
        renderTab(
            createUser({
                user_membership: membershipExpiring(200),
                blacklist_entry: { expires_at: null },
            }),
        );

        expect(screen.queryByRole("button", { name: renewName })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: browseName })).not.toBeInTheDocument();
    });

    it("sends the shop link to /shop", async () => {
        renderTab(createUser({ user_membership: membershipExpiring(200) }));

        await userEvent.click(screen.getByRole("button", { name: browseName }));

        expect(routerPush).toHaveBeenCalledWith(
            expect.stringContaining(`/${GlobalConstants.SHOP}`),
        );
    });
});
