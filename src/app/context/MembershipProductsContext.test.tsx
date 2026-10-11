import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { use } from "react";
import MembershipProductsProvider, {
    MembershipProduct,
    useMembershipProductsContext,
} from "./MembershipProductsContext";

const ProductNames = () => {
    const { membershipProductsPromise } = useMembershipProductsContext();
    const products = use(membershipProductsPromise);
    return (
        <ul>
            {products.map((m) => (
                <li key={m.product_id}>{m.product.name}</li>
            ))}
        </ul>
    );
};

describe("MembershipProductsContext", () => {
    it("exposes the promise so consumers can resolve it with use()", async () => {
        const products = [
            { product_id: "m-1", duration: 365, product: { id: "m-1", name: "Standard" } },
            { product_id: "m-2", duration: 365, product: { id: "m-2", name: "Supporter" } },
        ] as MembershipProduct[];

        await act(async () =>
            render(
                <MembershipProductsProvider membershipProductsPromise={Promise.resolve(products)}>
                    <ProductNames />
                </MembershipProductsProvider>,
            ),
        );

        expect(await screen.findByText("Standard")).toBeInTheDocument();
        expect(screen.getByText("Supporter")).toBeInTheDocument();
    });

    it("throws when used outside the provider", () => {
        expect(() => render(<ProductNames />)).toThrow(
            "useMembershipProductsContext must be used within MembershipProductsProvider",
        );
    });
});
