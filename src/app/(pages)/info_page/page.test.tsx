import { userHasRolePrivileges } from "../../lib/auth/auth-utils";
import GlobalConstants from "../../GlobalConstants";
import InfoPage from "./page";
import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import { getTextContent } from "../../lib/text-content-actions";
import { ReactElement } from "react";

vi.mock("../../lib/auth/auth-utils", () => ({
    userHasRolePrivileges: vi.fn(),
}));
vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));
vi.mock("../../lib/text-content-actions", () => ({
    getTextContent: vi.fn(),
}));
vi.mock("./InfoDashboard", () => ({
    default: () => <div data-testid="text-content">info page content</div>,
}));

describe("InfoPage", () => {
    it("renders info page correctly when user is authorized", async () => {
        const textContentData = { id: "content-id", translations: [] } as any;
        vi.mocked(getTextContent).mockResolvedValue(textContentData);
        vi.mocked(prisma.infoPage.findUniqueOrThrow).mockResolvedValue({
            lowest_allowed_user_role: null,
            content: { id: "content-id" },
            titleText: { id: "title-id", translations: [] },
        } as any);
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
        vi.mocked(userHasRolePrivileges).mockReturnValue(true);

        const result = (await InfoPage({
            searchParams: Promise.resolve({ [GlobalConstants.INFO_PAGE_ID]: "test-page-id" }),
        } as any)) as ReactElement;

        expect(prisma.infoPage.findUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: "test-page-id" },
            include: {
                titleText: { include: { translations: true } },
                content: true,
            },
        });
        expect(getLoggedInUser).toHaveBeenCalled();
        expect(userHasRolePrivileges).toHaveBeenCalledWith(null, null);
        expect(vi.mocked(getTextContent)).toHaveBeenCalledWith("content-id");
        expect(result.props).toStrictEqual({
            textContentPromise: Promise.resolve(textContentData),
            id: "content-id",
        });
    });
    it("throws error when user is unauthorized", async () => {
        vi.mocked(prisma.infoPage.findUniqueOrThrow).mockResolvedValue({
            lowest_allowed_user_role: null,
            content: { id: "content-id" },
            titleText: { id: "title-id", translations: [] },
        } as any);
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
        vi.mocked(userHasRolePrivileges).mockReturnValue(false);

        await expect(
            async () =>
                await InfoPage({
                    searchParams: Promise.resolve({
                        [GlobalConstants.INFO_PAGE_ID]: "test-page-id",
                    }),
                } as any),
        ).rejects.toThrow("Unauthorized");
        expect(prisma.infoPage.findUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: "test-page-id" },
            include: {
                titleText: { include: { translations: true } },
                content: true,
            },
        });
        expect(getLoggedInUser).toHaveBeenCalled();
        expect(userHasRolePrivileges).toHaveBeenCalledWith(null, null);
        expect(vi.mocked(getTextContent)).not.toHaveBeenCalled();
    });
    it("throws error when info page content is not found", async () => {
        vi.mocked(prisma.infoPage.findUniqueOrThrow).mockResolvedValue({
            lowest_allowed_user_role: null,
            content: null,
            titleText: { id: "title-id", translations: [] },
        } as any);

        await expect(
            async () =>
                await InfoPage({
                    searchParams: Promise.resolve({
                        [GlobalConstants.INFO_PAGE_ID]: "test-page-id",
                    }),
                } as any),
        ).rejects.toThrow("Info page content not found");
        expect(prisma.infoPage.findUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: "test-page-id" },
            include: {
                titleText: { include: { translations: true } },
                content: true,
            },
        });
        expect(getLoggedInUser).not.toHaveBeenCalled();
        expect(userHasRolePrivileges).not.toHaveBeenCalled();
        expect(vi.mocked(getTextContent)).not.toHaveBeenCalled();
    });
});
