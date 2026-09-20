import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RenewMembershipButton from "./RenewMembershipButton";
import { useUserContext } from "../context/UserContext";
import { useNotificationContext } from "../context/NotificationContext";
import { startMembershipRenewal } from "../lib/membership-actions";
import { MembershipState } from "../lib/membership-utils";
import LanguageTranslations from "../lib/membership-language-translations";
import { Language } from "../../prisma/generated/enums";

vi.mock("../lib/membership-actions", () => ({
    startMembershipRenewal: vi.fn(),
}));
vi.mock("../context/NotificationContext", () => ({
    useNotificationContext: vi.fn(),
}));

const addNotification = vi.fn();

describe("RenewMembershipButton", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({ language: Language.english } as any);
        vi.mocked(useNotificationContext).mockReturnValue({ addNotification });
        vi.mocked(startMembershipRenewal).mockResolvedValue(undefined);
    });

    it("labels the CTA 'Activate' for a member who never paid", () => {
        render(<RenewMembershipButton state={MembershipState.awaitingPayment} />);

        expect(
            screen.getByRole("button", {
                name: LanguageTranslations.activateMembership[Language.english],
            }),
        ).toBeInTheDocument();
    });

    it("labels the CTA 'Renew' for a lapsed membership", () => {
        render(<RenewMembershipButton state={MembershipState.expired} />);

        expect(
            screen.getByRole("button", {
                name: LanguageTranslations.renewMembership[Language.english],
            }),
        ).toBeInTheDocument();
    });

    it("notifies with the error string the action returns", async () => {
        vi.mocked(startMembershipRenewal).mockResolvedValue("You cannot renew right now");

        render(<RenewMembershipButton state={MembershipState.expired} />);
        await userEvent.click(screen.getByRole("button"));

        await waitFor(() =>
            expect(addNotification).toHaveBeenCalledWith("You cannot renew right now", "error"),
        );
    });

    it("notifies nothing when the action succeeds", async () => {
        render(<RenewMembershipButton state={MembershipState.expired} />);
        await userEvent.click(screen.getByRole("button"));

        await waitFor(() => expect(startMembershipRenewal).toHaveBeenCalled());
        expect(addNotification).not.toHaveBeenCalled();
    });

    it("notifies a generic failure when the action throws", async () => {
        vi.mocked(startMembershipRenewal).mockRejectedValue(new Error("boom"));

        render(<RenewMembershipButton state={MembershipState.expired} />);
        await userEvent.click(screen.getByRole("button"));

        await waitFor(() =>
            expect(addNotification).toHaveBeenCalledWith(
                LanguageTranslations.failedStartRenewal[Language.english],
                "error",
            ),
        );
    });

    it("rethrows the redirect that signals success instead of reporting a failure", async () => {
        const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
            digest: "NEXT_REDIRECT;push;/order;307;",
        });
        vi.mocked(startMembershipRenewal).mockRejectedValue(redirectError);
        // The rethrown redirect is what Next.js navigates on; in jsdom nothing
        // handles it, so swallow it here instead of failing the run.
        const swallowRedirect = vi.fn();
        process.on("uncaughtException", swallowRedirect);
        process.on("unhandledRejection", swallowRedirect);

        try {
            render(<RenewMembershipButton state={MembershipState.expired} />);
            await userEvent.click(screen.getByRole("button"));

            await waitFor(() => expect(swallowRedirect).toHaveBeenCalled());
            expect(swallowRedirect.mock.calls[0][0]).toBe(redirectError);
            expect(addNotification).not.toHaveBeenCalled();
        } finally {
            process.off("uncaughtException", swallowRedirect);
            process.off("unhandledRejection", swallowRedirect);
        }
    });
});
