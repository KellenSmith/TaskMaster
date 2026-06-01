import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import InfoDashboard from "./InfoDashboard";

const textContentMock = vi.fn();

vi.mock("../../ui/TextContent", () => ({
    __esModule: true,
    default: (props: any) => {
        textContentMock(props);
        return <div data-testid="text-content" />;
    },
}));

describe("InfoDashboard", () => {
    it("renders info dashboard with correct text content", async () => {
        const textContentPromise = Promise.resolve({
            id: "test-id",
            translations: [],
        });

        render(<InfoDashboard textContentPromise={textContentPromise as any} />);

        expect(await screen.findByTestId("text-content")).toBeInTheDocument();
        expect(textContentMock).toHaveBeenCalledWith({ textContentPromise });
    });
});
