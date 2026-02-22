import { screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import HomeDashboard from "./HomeDashboard";
import { customRender } from "../test/test-utils";
import { clientRedirect } from "./lib/utils";

// Mocks
vi.mock("./lib/utils", () => ({
    clientRedirect: vi.fn(),
    getRelativeUrl: vi.fn(() => "/calendar"),
    getAbsoluteUrl: vi.fn(() => "https://testurl.com/api/ticket-qrcode/1"),
}));
vi.mock("./ui/TextContent", () => ({
    __esModule: true,
    default: ({ id }: any) => <div data-testid="text-content">{id}</div>,
}));

const mockUser = { nickname: "TestUser" };
const mockTicketInfo = [
    {
        id: "1",
        ticket: { event: { title: "Event 1" } },
    },
    {
        id: "2",
        ticket: { event: { title: "Event 2" } },
    },
];

describe("HomeDashboard", () => {
    it("renders LoggedOutHomeDashboard for logged out user", async () => {
        const textContentPromise = Promise.resolve({ id: "home", translations: [] });
        await act(async () =>
            customRender(<HomeDashboard textContentPromise={textContentPromise as any} />, {
                language: "english",
            } as any),
        );
        expect(
            await screen.findByRole("button", { name: /apply for membership/i }),
        ).toBeInTheDocument();
        expect(await screen.findByTestId("text-content")).toHaveTextContent("home");
    });

    it("calls clientRedirect when apply button clicked", async () => {
        const textContentPromise = Promise.resolve({ id: "home", translations: [] });
        await act(async () =>
            customRender(<HomeDashboard textContentPromise={textContentPromise as any} />, {
                language: "english",
            } as any),
        );
        const button = await screen.findByRole("button", { name: "Apply for membership" });
        fireEvent.click(button);
        expect(vi.mocked(clientRedirect)).toHaveBeenCalledWith(expect.anything(), ["apply"]);
        expect(vi.mocked(clientRedirect).mock.calls[0][1]).toEqual(["apply"]);
    });

    it("renders correct language for swedish", async () => {
        const textContentPromise = Promise.resolve({ id: "home", translations: [] });
        await act(async () =>
            customRender(<HomeDashboard textContentPromise={textContentPromise as any} />, {
                user: mockUser,
                language: "swedish",
            } as any),
        );
        expect(
            await screen.findByRole("button", { name: "Ansök om medlemskap" }),
        ).toBeInTheDocument();
    });
});
