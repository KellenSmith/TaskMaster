import { render, screen } from "@testing-library/react";
import ContactDashboard from "./ContactDashboard";
import { vi, describe, it, expect } from "vitest";
import GlobalConstants from "../../GlobalConstants";

vi.mock("../../ui/TextContent", () => ({
    __esModule: true,
    default: ({ id }: any) => <div data-testid="text-content">{id}</div>,
}));

describe("ContactDashboard", () => {
    it("renders contact dashboard with correct text content", async () => {
        const textContentPromise = Promise.resolve({
            id: GlobalConstants.CONTACT,
            translations: [],
        });

        render(<ContactDashboard textContentPromise={textContentPromise as any} />);

        expect(await screen.findByTestId("text-content")).toHaveTextContent(
            GlobalConstants.CONTACT,
        );
    });
});
