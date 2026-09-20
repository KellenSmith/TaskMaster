import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import MembershipStatusCard from "./MembershipStatusCard";
import { useUserContext } from "../../context/UserContext";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { Language, UserRole, UserStatus } from "../../../prisma/generated/enums";
import LanguageTranslations from "./LanguageTranslations";

const createUser = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "user-1",
        role: UserRole.member,
        status: UserStatus.validated,
        created_at: new Date("2024-01-01T00:00:00.000Z"),
        user_membership: null,
        blacklist_entry: null,
        ...overrides,
    }) as any;

const membershipExpiring = (days: number) => ({
    membership_id: "membership-1",
    expires_at: dayjs.utc().add(days, "day").add(1, "hour").toDate(),
});

const renderCard = async (user: any) => {
    vi.mocked(useUserContext).mockReturnValue({ user, language: Language.english } as any);
    await act(async () =>
        render(
            <MembershipStatusCard
                membershipProductPromise={Promise.resolve({ name: "Annual membership" })}
            />,
        ),
    );
};

const en = Language.english;

describe("MembershipStatusCard", () => {
    beforeEach(() => {
        vi.mocked(useOrganizationSettingsContext).mockReturnValue({
            organizationSettings: { remind_membership_expires_in_days: 7 },
        } as any);
    });

    it("shows a green active chip and the membership details for a member in good standing", async () => {
        await renderCard(createUser({ user_membership: membershipExpiring(200) }));

        const chip = screen.getByText(LanguageTranslations.active[en]).closest(".MuiChip-root");
        expect(chip).toHaveClass("MuiChip-colorSuccess");
        expect(screen.getByText("Annual membership")).toBeInTheDocument();
        expect(screen.getByText(LanguageTranslations.membershipExpires[en])).toBeInTheDocument();
    });

    it("shows an amber 'expires in N days' chip inside the reminder window, keeping the details visible", async () => {
        await renderCard(createUser({ user_membership: membershipExpiring(3) }));

        const chip = screen
            .getByText(LanguageTranslations.expiresInDaysChip[en](3))
            .closest(".MuiChip-root");
        expect(chip).toHaveClass("MuiChip-colorWarning");
        expect(screen.getByText(LanguageTranslations.membershipExpires[en])).toBeInTheDocument();
    });

    it("shows a red expired chip and the renewal prompt for a lapsed membership", async () => {
        await renderCard(createUser({ user_membership: membershipExpiring(-2) }));

        const chip = screen.getByText(LanguageTranslations.expired[en]).closest(".MuiChip-root");
        expect(chip).toHaveClass("MuiChip-colorError");
        expect(
            screen.getByText("Your membership has expired and needs renewal"),
        ).toBeInTheDocument();
    });

    it("shows a blue pending chip, not a red one, while the application is under review", async () => {
        await renderCard(createUser({ status: UserStatus.pending }));

        const chip = screen.getByText(LanguageTranslations.pending[en]).closest(".MuiChip-root");
        expect(chip).toHaveClass("MuiChip-colorInfo");
        expect(chip).not.toHaveClass("MuiChip-colorError");
        expect(
            screen.getByText(LanguageTranslations.membershipPendingPrompt[en]),
        ).toBeInTheDocument();
    });

    it("shows a blue awaiting-activation chip and a welcome prompt for an approved member who never paid", async () => {
        await renderCard(createUser());

        const chip = screen
            .getByText(LanguageTranslations.awaitingPayment[en])
            .closest(".MuiChip-root");
        expect(chip).toHaveClass("MuiChip-colorInfo");
        expect(
            screen.getByText("Welcome! Activate your membership to get started"),
        ).toBeInTheDocument();
        expect(screen.queryByText(LanguageTranslations.expired[en])).not.toBeInTheDocument();
    });

    it("falls back to the red expired chip for a blacklisted user", async () => {
        await renderCard(
            createUser({
                user_membership: membershipExpiring(200),
                blacklist_entry: { expires_at: null },
            }),
        );

        const chip = screen.getByText(LanguageTranslations.expired[en]).closest(".MuiChip-root");
        expect(chip).toHaveClass("MuiChip-colorError");
    });
});
