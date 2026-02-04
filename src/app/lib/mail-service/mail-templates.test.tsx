import { describe, expect, it } from "vitest";
import OpenEventSpotTemplate from "./mail-templates/OpenEventSpotTemplate";
import OrderConfirmationTemplate from "./mail-templates/OrderConfirmationTemplate";
import SignInEmailTemplate from "./mail-templates/SignInEmailTemplate";

describe("mail templates", () => {
    it("throws when OpenEventSpotTemplate receives no event", () => {
        expect(() => OpenEventSpotTemplate({ event: undefined as any })).toThrow("Event not found");
    });

    it("renders OpenEventSpotTemplate with event data", () => {
        const element = OpenEventSpotTemplate({
            event: { id: "event-1", title: "Open Event" } as any,
        });

        expect(element).toBeTruthy();
    });

    it("renders OrderConfirmationTemplate with and without descriptions", () => {
        const element = OrderConfirmationTemplate({
            order: {
                id: "order-1",
                total_amount: 2500,
                order_items: [
                    {
                        quantity: 2,
                        price: 500,
                        product: { name: "Widget", description: "A great widget" },
                    },
                    {
                        quantity: 1,
                        price: 1000,
                        product: { name: "Gadget", description: null },
                    },
                ],
            } as any,
        });

        expect(element).toBeTruthy();
    });

    it("renders SignInEmailTemplate with email and link", () => {
        const element = SignInEmailTemplate({
            email: "user@example.com",
            url: "https://example.com/signin",
        });

        expect(element).toBeTruthy();
    });
});
