import HomePage from "./page";
import { vi, describe, it, expect } from "vitest";
import { getCachedTextContent } from "./lib/text-content-actions";
import dayjs from "dayjs";
import { ReactElement } from "react";
import GlobalConstants from "./GlobalConstants";

vi.mock("./ProtectedPage", () => ({
    default: vi.fn(({ children }) => children),
}));
vi.mock("./lib/text-content-actions", () => ({
    getTextContent: vi.fn(),
    getCachedTextContent: vi.fn(),
}));
const mockedNow = dayjs.utc();
beforeEach(() => {
    vi.spyOn(dayjs, "utc").mockReturnValue(mockedNow);
});

describe("HomePage", () => {
    it("returns ProtectedPage with the home dashboard props", async () => {
        const textContentData = {
            id: "home",
            translations: [],
        } as any;
        vi.mocked(getCachedTextContent).mockResolvedValue(textContentData);

        const result = (await HomePage({})) as ReactElement;

        expect(vi.mocked(getCachedTextContent)).toHaveBeenCalledWith("home");
        expect((result.props as any).name).toBe(GlobalConstants.HOME);

        const homeDashboard = (result.props as any).children as ReactElement<{
            textContentPromise: Promise<unknown>;
        }>;

        await expect(homeDashboard.props.textContentPromise).resolves.toBe(textContentData);
    });
});
