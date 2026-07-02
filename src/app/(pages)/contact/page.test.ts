import { ReactElement } from "react";
import { getCachedTextContent } from "../../lib/text-content-actions";
import ContactPage from "./page";
import GlobalConstants from "../../GlobalConstants";

vi.mock("../../ProtectedPage", () => ({
    default: vi.fn(({ children }) => children),
}));

vi.mock("../../lib/text-content-actions", () => ({
    getTextContent: vi.fn(),
    getCachedTextContent: vi.fn(),
}));

describe("ContactPage", () => {
    it("returns ProtectedPage with the contact dashboard props", async () => {
        const textContent = {
            id: "contact",
            translations: [],
        };
        vi.mocked(getCachedTextContent).mockResolvedValue(textContent as any);

        const result = (await ContactPage({})) as ReactElement;

        const props = result.props as {
            name: string;
            children: ReactElement<{ textContentPromise: Promise<unknown> }>;
        };

        expect(props.name).toBe(GlobalConstants.CONTACT);

        expect(vi.mocked(getCachedTextContent)).toHaveBeenCalledWith(GlobalConstants.CONTACT);
        await expect(props.children.props.textContentPromise).resolves.toStrictEqual(textContent);
    });
});
