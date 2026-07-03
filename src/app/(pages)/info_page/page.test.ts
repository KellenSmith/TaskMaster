import { userHasRolePrivileges } from "../../lib/auth/auth-utils";
import GlobalConstants from "../../GlobalConstants";
import InfoPage from "./page";
import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import { getCachedTextContent } from "../../lib/text-content-actions";
import { ReactElement } from "react";

vi.mock("../../ProtectedPage", () => ({
    default: vi.fn(({ children }) => children),
}));

type InfoPageElementProps = {
    name: string;
    children: ReactElement<{ textContentPromise: Promise<unknown> }>;
};

vi.mock("../../lib/auth/auth-utils", () => ({
    userHasRolePrivileges: vi.fn(),
}));
vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));
vi.mock("../../lib/text-content-actions", () => ({
    getTextContent: vi.fn(),
    getCachedTextContent: vi.fn(),
}));

describe("InfoPage", () => {
    it("renders info page correctly when user is authorized", async () => {
        const textContentData = { id: "content-id", translations: [] } as any;
        vi.mocked(getCachedTextContent).mockResolvedValue(textContentData);
        vi.mocked(prisma.infoPage.findUniqueOrThrow).mockResolvedValue({
            lowest_allowed_user_role: null,
            content: { id: "content-id" },
            titleText: { id: "title-id", translations: [] },
        } as any);
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
        vi.mocked(userHasRolePrivileges).mockReturnValue(true);

        const result = (await InfoPage({
            searchParams: Promise.resolve({ [GlobalConstants.INFO_PAGE_ID]: "test-page-id" }),
        } as any)) as ReactElement<InfoPageElementProps>;

        expect(result.props.name).toBe(GlobalConstants.INFO_PAGE);

        const infoDashboard = result.props.children;

        expect(prisma.infoPage.findUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: "test-page-id" },
            include: {
                titleText: { include: { translations: true } },
                content: true,
            },
        });
        await expect(infoDashboard.props.textContentPromise).resolves.toStrictEqual(
            textContentData,
        );
        expect(getLoggedInUser).toHaveBeenCalled();
        expect(userHasRolePrivileges).toHaveBeenCalledWith(null, null);
        expect(vi.mocked(getCachedTextContent)).toHaveBeenCalledWith("content-id");
        expect(infoDashboard.props).toHaveProperty("textContentPromise");
    });
    it("rejects the text content promise when user is unauthorized", async () => {
        vi.mocked(prisma.infoPage.findUniqueOrThrow).mockResolvedValue({
            lowest_allowed_user_role: null,
            content: { id: "content-id" },
            titleText: { id: "title-id", translations: [] },
        } as any);
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
        vi.mocked(userHasRolePrivileges).mockReturnValue(false);

        const result = (await InfoPage({
            searchParams: Promise.resolve({
                [GlobalConstants.INFO_PAGE_ID]: "test-page-id",
            }),
        } as any)) as ReactElement<InfoPageElementProps>;

        expect(result.props.name).toBe(GlobalConstants.INFO_PAGE);

        const infoDashboard = result.props.children;

        await expect(infoDashboard.props.textContentPromise).rejects.toThrow("Unauthorized");
        expect(prisma.infoPage.findUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: "test-page-id" },
            include: {
                titleText: { include: { translations: true } },
                content: true,
            },
        });
        expect(getLoggedInUser).toHaveBeenCalled();
        expect(userHasRolePrivileges).toHaveBeenCalledWith(null, null);
        expect(vi.mocked(getCachedTextContent)).not.toHaveBeenCalled();
    });
    it("rejects the text content promise when info page content is not found", async () => {
        vi.mocked(prisma.infoPage.findUniqueOrThrow).mockResolvedValue({
            lowest_allowed_user_role: null,
            content: null,
            titleText: { id: "title-id", translations: [] },
        } as any);

        const result = (await InfoPage({
            searchParams: Promise.resolve({
                [GlobalConstants.INFO_PAGE_ID]: "test-page-id",
            }),
        } as any)) as ReactElement<InfoPageElementProps>;

        expect(result.props.name).toBe(GlobalConstants.INFO_PAGE);

        const infoDashboard = result.props.children;

        await expect(infoDashboard.props.textContentPromise).rejects.toThrow(
            "Info page content not found",
        );
        expect(prisma.infoPage.findUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: "test-page-id" },
            include: {
                titleText: { include: { translations: true } },
                content: true,
            },
        });
        expect(getLoggedInUser).not.toHaveBeenCalled();
        expect(userHasRolePrivileges).not.toHaveBeenCalled();
        expect(vi.mocked(getCachedTextContent)).not.toHaveBeenCalled();
    });
});
