import HomePage from "./page";
import { vi, describe, it, expect } from "vitest";
import { getLoggedInUser } from "./lib/user-helpers";
import { getTextContent } from "./lib/text-content-actions";
import * as dayjs from "dayjs";
import { ReactElement } from "react";

vi.mock("./lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));
vi.mock("./lib/text-content-actions", () => ({
    getTextContent: vi.fn(),
}));
const mockedNow = dayjs.default();
beforeEach(() => {
    vi.spyOn(dayjs, "default").mockReturnValue(mockedNow);
});

describe("HomePage", () => {
    it("renders TextContent for logged-out user", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
        const textContentData = {
            id: "home",
            translations: [],
        } as any;
        vi.mocked(getTextContent).mockResolvedValue(textContentData);

        const result = (await HomePage({})) as ReactElement;

        expect(vi.mocked(getTextContent)).toHaveBeenCalledWith("home");
        expect(result.props).toStrictEqual({
            textContentPromise: Promise.resolve(textContentData),
        });
    });

    it("renders TextContent for logged in user", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: "user-1" } as any);
        const textContentData = {
            id: "home",
            translations: [],
        } as any;
        vi.mocked(getTextContent).mockResolvedValue(textContentData);

        const result = (await HomePage({})) as ReactElement;

        expect(vi.mocked(getTextContent)).toHaveBeenCalledWith("home");
        expect(result.props).toStrictEqual({
            textContentPromise: Promise.resolve(textContentData),
        });
    });
});
