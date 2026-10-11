import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenewMembershipButton from "./RenewMembershipButton";
import { useUserContext } from "../context/UserContext";
import { useNotificationContext } from "../context/NotificationContext";
import {
    MembershipProduct,
    useMembershipProductsContext,
} from "../context/MembershipProductsContext";
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
vi.mock("../context/MembershipProductsContext", () => ({
    useMembershipProductsContext: vi.fn(),
}));
vi.mock("../lib/membership-actions", () => ({
    startMembershipRenewal: vi.fn(),
}));
vi.mock("./form/RichTextField", () => ({
    default: ({ defaultValue }: { defaultValue: string }) => <div>{defaultValue}</div>,
}));
vi.mock("./utils", async (importOriginal) => ({
    ...((await importOriginal()) as object),
    allowRedirectException: vi.fn(),
}));

const addNotificationMock = vi.fn();

const standard = {
    product_id: "m-standard",
    duration: 365,
    product: { id: "m-standard", name: "Standard", description: null, price: 20000 },
} as MembershipProduct;
const supporter = {
    product_id: "m-supporter",
    duration: 365,
    product: { id: "m-supporter", name: "Supporter", description: "Extra love", price: 50000 },
} as MembershipProduct;

const givenProducts = (...products: MembershipProduct[]) =>
    vi.mocked(useMembershipProductsContext).mockReturnValue({
        membershipProductsPromise: Promise.resolve(products),
    });

const givenUserHolding = (membershipId: string | null) =>
    vi.mocked(useUserContext).mockReturnValue({
        language: Language.english,
        user: membershipId ? { user_membership: { membership_id: membershipId } } : null,
    } as any);

const clickRenew = async () =>
    userEvent.click(
        screen.getByRole("button", {
            name: LanguageTranslations.renewMembership[Language.english],
        }),
    );

describe("RenewMembershipButton", () => {
    beforeEach(() => {
        givenUserHolding(null);
        givenProducts(standard);
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

    describe("with a single membership product", () => {
        it("calls the renewal action without a product id and opens no dialog", async () => {
            vi.mocked(startMembershipRenewal).mockResolvedValue(undefined);
            render(<RenewMembershipButton state={MembershipState.expired} />);

            await clickRenew();

            await waitFor(() => expect(startMembershipRenewal).toHaveBeenCalledWith(undefined));
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            expect(addNotificationMock).not.toHaveBeenCalled();
        });

        it("surfaces the action's returned error message as a notification", async () => {
            vi.mocked(startMembershipRenewal).mockResolvedValue("Not eligible");
            render(<RenewMembershipButton state={MembershipState.expired} />);

            await clickRenew();

            await waitFor(() =>
                expect(addNotificationMock).toHaveBeenCalledWith("Not eligible", "error"),
            );
        });

        it("shows a generic failure when the action throws an ordinary error", async () => {
            vi.mocked(startMembershipRenewal).mockRejectedValue(new Error("boom"));
            render(<RenewMembershipButton state={MembershipState.expired} />);

            await clickRenew();

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

            await clickRenew();

            await waitFor(() => expect(allowRedirectException).toHaveBeenCalledWith(redirectError));
        });
    });

    describe("with several membership products", () => {
        beforeEach(() => givenProducts(standard, supporter));

        it("opens a dialog listing every tier instead of ordering immediately", async () => {
            render(<RenewMembershipButton state={MembershipState.expired} />);

            await clickRenew();

            const dialog = await screen.findByRole("dialog");
            expect(within(dialog).getByLabelText(/Standard/)).toBeInTheDocument();
            expect(within(dialog).getByLabelText(/Supporter/)).toBeInTheDocument();
            expect(within(dialog).getByText("500 SEK · 365 days")).toBeInTheDocument();
            expect(startMembershipRenewal).not.toHaveBeenCalled();
        });

        it("keeps tier descriptions collapsed until asked for", async () => {
            render(<RenewMembershipButton state={MembershipState.expired} />);

            await clickRenew();
            const dialog = await screen.findByRole("dialog");
            expect(within(dialog).getByText("Extra love")).not.toBeVisible();

            await userEvent.click(
                within(dialog).getByRole("button", {
                    name: LanguageTranslations.details[Language.english],
                }),
            );

            await waitFor(() => expect(within(dialog).getByText("Extra love")).toBeVisible());
            // Expanding details must not change the selection
            expect(within(dialog).getByLabelText(/Standard/)).toBeChecked();
        });

        it("preselects and marks the tier the member currently holds", async () => {
            givenUserHolding(supporter.product_id);
            render(<RenewMembershipButton state={MembershipState.expiringSoon} />);

            await clickRenew();

            const dialog = await screen.findByRole("dialog");
            expect(within(dialog).getByLabelText(/Supporter/)).toBeChecked();
            expect(within(dialog).getByLabelText(/Standard/)).not.toBeChecked();
            expect(
                within(dialog).getByText(LanguageTranslations.currentMembership[Language.english]),
            ).toBeInTheDocument();
        });

        it("preselects the first tier when the member holds none of them", async () => {
            givenUserHolding("m-deleted");
            render(<RenewMembershipButton state={MembershipState.expired} />);

            await clickRenew();

            const dialog = await screen.findByRole("dialog");
            expect(within(dialog).getByLabelText(/Standard/)).toBeChecked();
        });

        it("confirm calls the action with the selected tier", async () => {
            vi.mocked(startMembershipRenewal).mockResolvedValue(undefined);
            render(<RenewMembershipButton state={MembershipState.expired} />);

            await clickRenew();
            const dialog = await screen.findByRole("dialog");
            await userEvent.click(within(dialog).getByLabelText(/Supporter/));
            await userEvent.click(
                within(dialog).getByRole("button", {
                    name: LanguageTranslations.confirm[Language.english],
                }),
            );

            await waitFor(() =>
                expect(startMembershipRenewal).toHaveBeenCalledWith(supporter.product_id),
            );
        });

        it("cancel closes the dialog and creates no order", async () => {
            render(<RenewMembershipButton state={MembershipState.expired} />);

            await clickRenew();
            const dialog = await screen.findByRole("dialog");
            await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

            await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
            expect(startMembershipRenewal).not.toHaveBeenCalled();
        });
    });

    it("forwards extra button props", () => {
        render(
            <RenewMembershipButton state={MembershipState.expired} data-testid="renew" fullWidth />,
        );
        expect(screen.getByTestId("renew")).toHaveClass("MuiButton-fullWidth");
    });
});
