import { ReactElement } from "react";
import { getCachedTextContent } from "../../lib/text-content-actions";
import ContactPage from "./page";

getCachedTextContent;
vi.mock("../../lib/text-content-actions", () => ({
    getTextContent: vi.fn(),
    getCachedTextContent: vi.fn(),
}));

describe("ContactPage", () => {
    it("renders text content without crashing", async () => {
        const textContent = {
            id: "contact",
            translations: [],
        };
        vi.mocked(getCachedTextContent).mockResolvedValue(textContent as any);

        const result = (await ContactPage({})) as ReactElement;

        expect(result.props).toStrictEqual({
            textContentPromise: Promise.resolve(textContent),
        });
    });
});
