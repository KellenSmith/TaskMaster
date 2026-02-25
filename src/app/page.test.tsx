import HomePage from "./page";
import { vi, describe, it, expect } from "vitest";
import { getLoggedInUser } from "./lib/user-helpers";
import { getTextContent } from "./lib/text-content-actions";
import dayjs from "dayjs";

vi.mock("./lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));
vi.mock("./lib/text-content-actions", () => ({
    getTextContent: vi.fn(),
}));
const mockedNow = dayjs.utc();
beforeEach(() => {
    vi.spyOn(dayjs, "utc").mockReturnValue(mockedNow);
});

// Mock child components
vi.mock("./HomeDashboard", () => ({
    default: () => <div data-testid="home-dashboard">HomeDashboard</div>,
}));

describe("HomePage", () => {
    it("renders TextContent for logged-out user", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);

        await HomePage({});

        expect(vi.mocked(getTextContent)).toHaveBeenCalledWith("home");
    });

    it("renders TextContent for logged in user", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: "user-1" } as any);

        await HomePage({});

        expect(vi.mocked(getTextContent)).toHaveBeenCalledWith("home");
    });
});
