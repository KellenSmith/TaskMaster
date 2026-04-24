import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NavPanel from "./NavPanel";
import { useUserContext } from "../context/UserContext";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { usePathname, useRouter } from "next/navigation";
import { UserRole, UserStatus, Language } from "../../prisma/generated/enums";
import { logOut } from "../lib/user-actions";
import { createInfoPage, deleteInfoPage, updateInfoPage } from "../lib/info-page-actions";
import GlobalConstants from "../GlobalConstants";
import NotificationContextProvider from "../context/NotificationContext";
import dayjs from "../lib/dayjs";

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    usePathname: vi.fn(() => "/"),
}));

vi.mock("../lib/user-actions", () => ({
    logOut: vi.fn(),
}));

vi.mock("../lib/info-page-actions", () => ({
    createInfoPage: vi.fn(),
    updateInfoPage: vi.fn(),
    deleteInfoPage: vi.fn(),
}));

const routerPushMock = vi.fn();
const setEditModeMock = vi.fn();

const createUser = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "user-1",
        role: UserRole.member,
        status: UserStatus.validated,
        user_membership: {
            expires_at: dayjs("2099-01-01T00:00:00.000"),
        },
        ...overrides,
    }) as any;

const createInfoPageItem = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "info-page-1",
        lowest_allowed_user_role: UserRole.member,
        titleText: {
            translations: [
                { language: Language.english, text: "Member Info" },
                { language: Language.swedish, text: "Medlemsinfo" },
            ],
        },
        ...overrides,
    }) as any;

const makeOrganizationSettingsContext = (overrides: Record<string, unknown> = {}) => ({
    organizationSettings: {
        logo_url: "/images/custom-logo.svg",
        terms_of_membership_english_url: "https://example.com/membership-en.pdf",
        privacy_policy_english_url: "https://example.com/privacy-en.pdf",
        terms_of_purchase_english_url: "https://example.com/purchase-en.pdf",
        ...overrides,
    },
    infopagesPromise: Promise.resolve([createInfoPageItem()]),
});

const renderNavPanel = async () => {
    await act(async () => {
        render(
            <NotificationContextProvider>
                <NavPanel />
            </NotificationContextProvider>,
        );
    });
};

const openNavigationDrawer = async () => {
    await userEvent.click(screen.getByRole("button", { name: "open navigation" }));
};

describe("NavPanel", () => {
    beforeEach(() => {
        vi.mocked(useRouter).mockReturnValue({ push: routerPushMock } as any);
        vi.mocked(usePathname).mockReturnValue("/dashboard");
        vi.mocked(useUserContext).mockReturnValue({
            user: createUser(),
            editMode: false,
            setEditMode: setEditModeMock,
            language: Language.english,
        } as any);
        vi.mocked(useOrganizationSettingsContext).mockReturnValue(
            makeOrganizationSettingsContext() as any,
        );
    });

    it("renders app bar and organization logo", async () => {
        await renderNavPanel();

        expect(screen.getByRole("button", { name: "open navigation" })).toBeInTheDocument();
        expect(screen.getByAltText("TaskMaster")).toBeInTheDocument();
    });

    it("opens drawer and shows logout for logged-in user", async () => {
        await renderNavPanel();
        await openNavigationDrawer();

        expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    });

    it("shows login action for guests and redirects to login", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: null,
            editMode: false,
            setEditMode: setEditModeMock,
            language: Language.english,
        } as any);

        await renderNavPanel();
        await openNavigationDrawer();
        await userEvent.click(screen.getByRole("button", { name: "Login" }));

        expect(routerPushMock).toHaveBeenCalledWith("/login");
    });

    it("shows authorized routes and disables current route button", async () => {
        vi.mocked(usePathname).mockReturnValue("/contact");
        vi.mocked(useUserContext).mockReturnValue({
            user: null,
            editMode: false,
            setEditMode: setEditModeMock,
            language: Language.english,
        } as any);

        await renderNavPanel();
        await openNavigationDrawer();

        const contactRouteButton = screen.getByRole("button", { name: "Contact" });
        expect(contactRouteButton).toBeDisabled();
        expect(screen.queryByRole("button", { name: "Home" })).not.toBeInTheDocument();
    });

    it("navigates to info page when info page button is clicked", async () => {
        await renderNavPanel();
        await openNavigationDrawer();

        await userEvent.click(screen.getByRole("button", { name: "Member Info" }));

        expect(routerPushMock).toHaveBeenCalledWith(
            `/${GlobalConstants.INFO_PAGE}?${GlobalConstants.INFO_PAGE_ID}=info-page-1`,
        );
    });

    it("renders policy and terms links from organization settings", async () => {
        await renderNavPanel();
        await openNavigationDrawer();

        expect(screen.getByRole("link", { name: /terms of membership/i })).toHaveAttribute(
            "href",
            "https://example.com/membership-en.pdf",
        );
        expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
            "href",
            "https://example.com/privacy-en.pdf",
        );
        expect(screen.getByRole("link", { name: /terms of purchase/i })).toHaveAttribute(
            "href",
            "https://example.com/purchase-en.pdf",
        );
    });

    it("shows admin edit controls for admins and toggles edit mode", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: createUser({ role: UserRole.admin }),
            editMode: false,
            setEditMode: setEditModeMock,
            language: Language.english,
        } as any);

        await renderNavPanel();
        await openNavigationDrawer();

        await userEvent.click(screen.getByRole("button", { name: "enter edit mode" }));

        expect(setEditModeMock).toHaveBeenCalledTimes(1);
        const toggleCallback = setEditModeMock.mock.calls[0][0] as (prev: boolean) => boolean;
        expect(toggleCallback(false)).toBe(true);
    });

    it("opens add info page dialog and submits create action", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: createUser({ role: UserRole.admin }),
            editMode: true,
            setEditMode: setEditModeMock,
            language: Language.english,
        } as any);
        vi.mocked(createInfoPage).mockResolvedValue(undefined as any);

        await renderNavPanel();
        await openNavigationDrawer();

        await userEvent.click(screen.getByRole("button", { name: "add info page" }));

        const dialogs = screen.getAllByRole("dialog");
        const formDialog = dialogs[dialogs.length - 1];
        await userEvent.type(
            within(formDialog).getByRole("textbox", { name: "Title" }),
            "New info page",
        );
        await userEvent.click(within(formDialog).getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(createInfoPage).toHaveBeenCalledTimes(1);
        });
        expect(await screen.findByText("Saved")).toBeInTheDocument();
    });

    it("opens update info page dialog from edit button and submits update action", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: createUser({ role: UserRole.admin }),
            editMode: true,
            setEditMode: setEditModeMock,
            language: Language.english,
        } as any);
        vi.mocked(updateInfoPage).mockResolvedValue(undefined as any);

        await renderNavPanel();
        await openNavigationDrawer();

        const editButtons = screen
            .getAllByRole("button")
            .filter((button) => button.querySelector("svg[data-testid='EditIcon']"));
        await userEvent.click(editButtons[0]);

        const dialogs = screen.getAllByRole("dialog");
        const formDialog = dialogs[dialogs.length - 1];
        expect(within(formDialog).getByRole("textbox", { name: "Title" })).toHaveValue(
            "Member Info",
        );

        await userEvent.click(within(formDialog).getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(updateInfoPage).toHaveBeenCalledWith(
                expect.any(FormData),
                "info-page-1",
                Language.english,
            );
        });
        expect(await screen.findByText("Saved")).toBeInTheDocument();
    });

    it("deletes an info page via confirmation flow and notifies success", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: createUser({ role: UserRole.admin }),
            editMode: true,
            setEditMode: setEditModeMock,
            language: Language.english,
        } as any);
        vi.mocked(deleteInfoPage).mockResolvedValue(undefined as any);

        await renderNavPanel();
        await openNavigationDrawer();

        const deleteButtons = screen
            .getAllByRole("button")
            .filter((button) => button.querySelector("svg[data-testid='DeleteIcon']"));
        await userEvent.click(deleteButtons[0]);
        await userEvent.click(screen.getByRole("button", { name: "Proceed" }));

        await waitFor(() => {
            expect(deleteInfoPage).toHaveBeenCalledWith("info-page-1");
        });
        expect(await screen.findByText("Deleted")).toBeInTheDocument();
    });

    it("shows error notification when logout unexpectedly resolves", async () => {
        vi.mocked(logOut).mockResolvedValue(undefined as any);

        await renderNavPanel();
        await openNavigationDrawer();
        await userEvent.click(screen.getByRole("button", { name: "Logout" }));

        expect(await screen.findByText("Failed to log out")).toBeInTheDocument();
    });
});
