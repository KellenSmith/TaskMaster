import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductCard from "./ProductCard";
import { useUserContext } from "../../context/UserContext";
import { Language } from "../../../prisma/generated/enums";
import dayjs from "dayjs";

const makeProduct = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "product-1",
        name: "Standard Ticket",
        description: "<p>Product description</p>",
        price: 12000,
        stock: 10,
        image_url: "",
        vat_percentage: 25,
        created_at: dayjs("2025-01-01T00:00:00.000").toDate(),
        updated_at: dayjs("2025-01-02T00:00:00.000").toDate(),
        ...overrides,
    }) as any;

describe("ProductCard", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.english,
        } as any);
    });

    it("renders product name, formatted price and in-stock chip", () => {
        render(<ProductCard product={makeProduct({ stock: 8 })} />);

        expect(screen.getByText("Standard Ticket")).toBeInTheDocument();
        expect(screen.getByText("120 SEK")).toBeInTheDocument();
        expect(screen.getByText("In Stock")).toBeInTheDocument();
    });

    it("renders out-of-stock and low-stock labels", () => {
        const { rerender } = render(<ProductCard product={makeProduct({ stock: 0 })} />);
        expect(screen.getByText("Out of Stock")).toBeInTheDocument();

        rerender(<ProductCard product={makeProduct({ stock: 3 })} />);
        expect(screen.getByText("3 left")).toBeInTheDocument();
    });

    it("does not render stock chip when stock is null", () => {
        render(<ProductCard product={makeProduct({ stock: null })} />);

        expect(screen.queryByText("In Stock")).not.toBeInTheDocument();
        expect(screen.queryByText("Out of Stock")).not.toBeInTheDocument();
    });

    it("opens details dialog on card click by default", async () => {
        render(<ProductCard product={makeProduct()} />);

        await userEvent.click(screen.getByText("Standard Ticket"));

        expect(await screen.findByRole("dialog")).toBeInTheDocument();
        expect(screen.getAllByText("Standard Ticket").length).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("uses custom onClick handler instead of opening dialog", async () => {
        const onClick = vi.fn();
        render(<ProductCard product={makeProduct()} onClick={onClick} />);

        await userEvent.click(screen.getByText("Standard Ticket"));

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("calls onAddToCart with product id from dialog", async () => {
        const onAddToCart = vi.fn();
        render(<ProductCard product={makeProduct({ stock: 2 })} onAddToCart={onAddToCart} />);

        await userEvent.click(screen.getByText("Standard Ticket"));
        await userEvent.click(await screen.findByRole("button", { name: "BUY" }));

        expect(onAddToCart).toHaveBeenCalledTimes(1);
        expect(onAddToCart).toHaveBeenCalledWith("product-1");
    });

    it("disables buy button when product is unavailable or out of stock", async () => {
        const onAddToCart = vi.fn();
        const { rerender } = render(
            <ProductCard
                product={makeProduct({ stock: 5 })}
                onAddToCart={onAddToCart}
                isAvailable={false}
            />,
        );

        await userEvent.click(screen.getAllByText("Standard Ticket")[0]);
        expect(await screen.findByRole("button", { name: "BUY" })).toBeDisabled();
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

        rerender(
            <ProductCard
                product={makeProduct({ stock: 0 })}
                onAddToCart={onAddToCart}
                isAvailable={true}
            />,
        );

        await userEvent.click(screen.getAllByText("Standard Ticket")[0]);
        const buyButtons = await screen.findAllByRole("button", { name: "BUY" });
        expect(buyButtons[buyButtons.length - 1]).toBeDisabled();
    });

    it("shows availability tooltip when unavailable and tooltip text provided", async () => {
        render(
            <ProductCard
                product={makeProduct()}
                isAvailable={false}
                makeAvailableText="Requires active membership"
            />,
        );

        await userEvent.hover(screen.getByText("Standard Ticket"));

        expect(await screen.findByText("Requires active membership")).toBeInTheDocument();
    });

    it("renders swedish labels and free-product buy action text", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.swedish,
        } as any);

        render(<ProductCard product={makeProduct({ price: 0, stock: 4 })} onAddToCart={vi.fn()} />);

        expect(screen.getByText("4 kvar")).toBeInTheDocument();
        await userEvent.click(screen.getByText("Standard Ticket"));

        expect(await screen.findByRole("button", { name: "HAFFA" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Avbryt" })).toBeInTheDocument();
    });

    it("uses placeholder image when image_url is missing", async () => {
        render(<ProductCard product={makeProduct({ image_url: "" })} />);

        const cardImage = screen.getByRole("img", { name: "Standard Ticket" });
        expect(cardImage).toHaveAttribute(
            "src",
            expect.stringContaining("product-placeholder.svg"),
        );

        await userEvent.click(screen.getByText("Standard Ticket"));
        await waitFor(() => {
            const allImages = screen.getAllByRole("img", { name: "Standard Ticket" });
            expect(
                allImages.some((image) =>
                    image.getAttribute("src")?.includes("product-placeholder.svg"),
                ),
            ).toBe(true);
        });
    });
});
