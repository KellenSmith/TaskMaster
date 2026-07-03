import { screen, render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import HomeDashboard from "./HomeDashboard";
import { clientRedirect } from "./lib/utils";
import { useUserContext } from "./context/UserContext";
import { Language } from "../prisma/generated/enums";
import userEvent from "@testing-library/user-event";

const textContentMock = vi.fn();

// Mocks
vi.mock("./lib/utils", () => ({
    clientRedirect: vi.fn(),
}));
vi.mock("./ui/TextContent", () => ({
    __esModule: true,
    default: (props: any) => {
        textContentMock(props);
        return <div data-testid="text-content" />;
    },
}));

describe("HomeDashboard", () => {
    beforeEach(() => {
        textContentMock.mockClear();
    });

    it("renders home dashboard for logged out user", async () => {
        const textContentPromise = Promise.resolve({ id: "home", translations: [] });

        render(<HomeDashboard textContentPromise={textContentPromise as any} />);

        expect(
            await screen.findByRole("button", { name: /apply for membership/i }),
        ).toBeInTheDocument();
        expect(await screen.findByTestId("text-content")).toBeInTheDocument();
        expect(textContentMock).toHaveBeenCalledWith({ textContentPromise });
    });

    it("calls clientRedirect when apply button clicked", async () => {
        const textContentPromise = Promise.resolve({ id: "home", translations: [] });

        render(<HomeDashboard textContentPromise={textContentPromise as any} />);

        const button = await screen.findByRole("button", { name: "Apply for membership" });
        await userEvent.click(button);
        expect(vi.mocked(clientRedirect)).toHaveBeenCalledWith(expect.anything(), ["apply"]);
        expect(vi.mocked(clientRedirect).mock.calls[0][1]).toEqual(["apply"]);
    });

    it("renders correct language for swedish", async () => {
        const textContentPromise = Promise.resolve({ id: "home", translations: [] });
        vi.mocked(useUserContext).mockReturnValue({
            user: null,
            language: Language.swedish,
        } as any);

        render(<HomeDashboard textContentPromise={textContentPromise as any} />);

        expect(
            await screen.findByRole("button", { name: "Ansök om medlemskap" }),
        ).toBeInTheDocument();
    });
});
