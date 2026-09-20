import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MembershipStepper, { getPayStepCopy } from "./MembershipStepper";
import { useUserContext } from "../context/UserContext";
import {
    MembershipProduct,
    useMembershipProductsContext,
} from "../context/MembershipProductsContext";
import { Language } from "../../prisma/generated/enums";
import LanguageTranslations from "../lib/membership-language-translations";

vi.mock("../context/UserContext", () => ({
    useUserContext: vi.fn(),
}));
vi.mock("../context/MembershipProductsContext", () => ({
    useMembershipProductsContext: vi.fn(),
}));
vi.mock("@mui/material", async (importOriginal) => ({
    ...((await importOriginal()) as object),
    useMediaQuery: vi.fn(() => false),
}));

const product = (id: string, name: string, price: number, duration = 365) =>
    ({
        product_id: id,
        duration,
        product: { id, name, description: null, price },
    }) as MembershipProduct;

const standard = product("m-standard", "Standard", 20000);
const supporter = product("m-supporter", "Supporter", 50000, 730);
const gratis = product("m-free", "Basic", 0);

const givenProducts = (...products: MembershipProduct[]) =>
    vi.mocked(useMembershipProductsContext).mockReturnValue({
        membershipProductsPromise: Promise.resolve(products),
    });

const renderStepper = async (activeStep: number) =>
    act(async () =>
        render(
            <Suspense fallback={<div>loading</div>}>
                <MembershipStepper activeStep={activeStep} />
            </Suspense>,
        ),
    );

const pay = LanguageTranslations.steps.pay;

describe("MembershipStepper", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({ language: Language.english } as any);
        givenProducts(standard);
    });

    it("renders all four steps with their hints", async () => {
        await renderStepper(0);
        for (const step of ["apply", "review", "active"] as const) {
            expect(
                screen.getByText(LanguageTranslations.steps[step].label[Language.english]),
            ).toBeInTheDocument();
            expect(
                screen.getByText(LanguageTranslations.steps[step].hint[Language.english]),
            ).toBeInTheDocument();
        }
    });

    it("marks earlier steps completed and the current one active", async () => {
        await renderStepper(2);
        expect(screen.getAllByTestId("step-completed")).toHaveLength(2);
        expect(screen.getAllByTestId("step-active")).toHaveLength(1);
        expect(screen.getAllByTestId("step-upcoming")).toHaveLength(1);
    });

    describe("pay step reflects what the organization offers", () => {
        it("says activation is free when every membership product is free", async () => {
            givenProducts(gratis);
            await renderStepper(1);
            expect(screen.getByText(pay.activateLabel[Language.english])).toBeInTheDocument();
            expect(screen.getByText(pay.hintFree[Language.english])).toBeInTheDocument();
        });

        it("states the price and duration for a single paid product", async () => {
            await renderStepper(1);
            expect(screen.getByText(pay.payLabel[Language.english])).toBeInTheDocument();
            expect(screen.getByText(/200 SEK for 365 days/)).toBeInTheDocument();
        });

        it("lists each option when there is a choice, marking free ones", async () => {
            givenProducts(standard, supporter, gratis);
            await renderStepper(1);
            const hint = screen.getByText(/Choose between/);
            expect(hint).toHaveTextContent("Standard 200 SEK");
            expect(hint).toHaveTextContent("Supporter 500 SEK");
            expect(hint).toHaveTextContent("Basic (free)");
        });

        it("falls back to a generic hint when no membership product exists yet", async () => {
            givenProducts();
            await renderStepper(1);
            expect(screen.getByText(pay.hintUnknown[Language.english])).toBeInTheDocument();
        });
    });

    it("localizes the pay copy", () => {
        expect(getPayStepCopy([gratis], Language.swedish)).toEqual({
            label: pay.activateLabel[Language.swedish],
            hint: pay.hintFree[Language.swedish],
        });
        expect(getPayStepCopy([standard], Language.swedish).hint).toMatch(/200 SEK för 365 dagar/);
    });
});
