import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenewMembershipButton from "./RenewMembershipButton";
import { useUserContext } from "../context/UserContext";
import { useNotificationContext } from "../context/NotificationContext";
import { startMembershipRenewal } from "../lib/membership-actions";
import { allowRedirectException } from "./utils";
import { Language } from "../../prisma/generated/enums";
import { MembershipState } from "../lib/membership-utils";
import LanguageTranslations from "../lib/membership-language-translations";

vi.mock("../context/UserContext", () => ({
    useUserContext: vi.fn(),
}));
vi.mock("../context/NotificationContext", () => ({
    useNotificationContext: vi.fn(),
}));
vi.mock("../lib/membership-actions", () => ({
    startMembershipRenewal: vi.fn(),
}));
vi.mock("./utils", () => ({
    allowRedirectException: vi.fn(),
}));

const addNotificationMock = vi.fn();

describe("RenewMembershipButton", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({ language: Language.english } as any);
        vi.mocked(useNotificationContext).mockReturnValue({
            addNotification: addNotificationMock,
        } as any);
    });

    it("labels the button 'activate' for users who never held a membership", () => {
        render(<RenewMembershipButton state={MembershipState.awaitingPayment} />);
        expect(
            screen.getByRole("button", {
                name: LanguageTranslations.activateMembership[Language.english],
            }),
        ).toBeInTheDocument();
    });

    it("labels the button 'renew' for every other state", () => {
        render(<RenewMembershipButton state={MembershipState.expired} />);
        expect(
            screen.getByRole("button", {
                name: LanguageTranslations.renewMembership[Language.english],
            }),
        ).toBeInTheDocument();
    });

    it("calls the renewal action on click and shows nothing on success", async () => {
        vi.mocked(startMembershipRenewal).mockResolvedValue(undefined);
        render(<RenewMembershipButton state={MembershipState.expired} />);

        await userEvent.click(screen.getByRole("button"));

        await waitFor(() => expect(startMembershipRenewal).toHaveBeenCalledTimes(1));
        expect(addNotificationMock).not.toHaveBeenCalled();
    });

    it("surfaces the action's returned error message as a notification", async () => {
        vi.mocked(startMembershipRenewal).mockResolvedValue("Not eligible");
        render(<RenewMembershipButton state={MembershipState.expired} />);

        await userEvent.click(screen.getByRole("button"));

        await waitFor(() =>
            expect(addNotificationMock).toHaveBeenCalledWith("Not eligible", "error"),
        );
    });

    it("shows a generic failure when the action throws an ordinary error", async () => {
        vi.mocked(startMembershipRenewal).mockRejectedValue(new Error("boom"));
        render(<RenewMembershipButton state={MembershipState.expired} />);

        await userEvent.click(screen.getByRole("button"));

        await waitFor(() =>
            expect(addNotificationMock).toHaveBeenCalledWith(
                LanguageTranslations.failedStartRenewal[Language.english],
                "error",
            ),
        );
    });

    it("passes a thrown redirect through the redirect gate instead of swallowing it", async () => {
        const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
            digest: "NEXT_REDIRECT;replace;/order?order_id=1;307;",
        });
        vi.mocked(startMembershipRenewal).mockRejectedValue(redirectError);
        render(<RenewMembershipButton state={MembershipState.expired} />);

        await userEvent.click(screen.getByRole("button"));

        await waitFor(() => expect(allowRedirectException).toHaveBeenCalledWith(redirectError));
    });

    it("forwards extra button props", () => {
        render(
            <RenewMembershipButton state={MembershipState.expired} data-testid="renew" fullWidth />,
        );
        expect(screen.getByTestId("renew")).toHaveClass("MuiButton-fullWidth");
    });
});
