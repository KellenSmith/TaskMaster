import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import GlobalConstants from "../../GlobalConstants";
import InfoDashboard from "./InfoDashboard";

vi.mock("../../ui/TextContent", () => ({
    __esModule: true,
    default: ({ id }: any) => <div data-testid="text-content">{id}</div>,
}));

describe("InfoDashboard", () => {
    it("renders info dashboard with correct text content", async () => {
        const textContentPromise = Promise.resolve({
            id: "test-id",
            translations: [],
        });

        render(<InfoDashboard id={"test-id"} textContentPromise={textContentPromise as any} />);

        expect(await screen.findByTestId("text-content")).toHaveTextContent("test-id");
    });
});
