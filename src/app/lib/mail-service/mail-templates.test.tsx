import { describe, expect, it, vi } from "vitest";
import OpenEventSpotTemplate from "./mail-templates/OpenEventSpotTemplate";
import OrderConfirmationTemplate from "./mail-templates/OrderConfirmationTemplate";
import SignInEmailTemplate from "./mail-templates/SignInEmailTemplate";
import MailTemplate from "./mail-templates/MailTemplate";
import { Img, Heading } from "@react-email/components";

// vi.mock is hoisted; if the factory runs before this mock is initialized it throws.
// We import MailTemplate at the top, which immediately pulls in getOrganizationSettings,
// so we must create the mock during the hoisting phase which happens before imports.
const getOrganizationSettingsMock = vi.hoisted(() => vi.fn());

vi.mock("../organization-settings-actions", () => ({
    getOrganizationSettings: getOrganizationSettingsMock,
}));

// We traverse the raw React element tree here because these templates are not rendered
// into a DOM in these tests; Testing Library selectors like getByText require a DOM.
// This helper lets us locate elements (e.g., Img/Heading) directly in the element tree.
const findNode = (node: any, predicate: (value: any) => boolean): any => {
    if (!node) return undefined;
    if (predicate(node)) return node;
    const children = node.props?.children;
    if (!children) return undefined;
    if (Array.isArray(children)) {
        for (const child of children) {
            const result = findNode(child, predicate);
            if (result) return result;
        }
    } else {
        return findNode(children, predicate);
    }
    return undefined;
};

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

    it("renders logo image when organizationSettings.logo_url is present", async () => {
        getOrganizationSettingsMock.mockResolvedValueOnce({
            logo_url: "https://example.com/logo.png",
        });

        const element = await MailTemplate({
            children: "content",
        });

        const imgNode = findNode(element, (node) => node.type === Img);
        expect(imgNode).toBeTruthy();
        expect(imgNode.props.src).toBe("https://example.com/logo.png");
    });

    it("renders heading when no logo_url is present", async () => {
        getOrganizationSettingsMock.mockResolvedValueOnce(null);

        const element = await MailTemplate({
            children: "content",
        });

        const headingNode = findNode(element, (node) => node.type === Heading);
        expect(headingNode).toBeTruthy();
    });
});
