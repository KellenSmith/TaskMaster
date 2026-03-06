import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageMenu from "./LanguageMenu";
import { useUserContext } from "../context/UserContext";
import { Language } from "../../prisma/generated/enums";

describe("LanguageMenu", () => {
    const setLanguageMock = vi.fn();

    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.english,
            setLanguage: setLanguageMock,
        } as any);
    });

    it("renders the current language flag", () => {
        render(<LanguageMenu />);

        const currentFlag = screen.getByRole("img", { name: "english flag" });
        expect(currentFlag).toHaveAttribute("src", expect.stringContaining("british-flag.svg"));
    });

    it("opens menu with all language options when clicking the current flag", async () => {
        render(<LanguageMenu />);

        await userEvent.click(screen.getByRole("img", { name: "english flag" }));

        const menu = await screen.findByRole("menu");
        const menuItems = within(menu).getAllByRole("menuitem");
        expect(menuItems).toHaveLength(2);
        expect(within(menu).getByRole("img", { name: "english flag" })).toBeInTheDocument();
        expect(within(menu).getByRole("img", { name: "swedish flag" })).toBeInTheDocument();
    });

    it("marks the current language as selected in the menu", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.swedish,
            setLanguage: setLanguageMock,
        } as any);

        render(<LanguageMenu />);
        await userEvent.click(screen.getByRole("img", { name: "swedish flag" }));

        const menu = await screen.findByRole("menu");
        const selectedLanguageImage = within(menu).getByRole("img", { name: "swedish flag" });
        const selectedMenuItem = selectedLanguageImage.closest("[role='menuitem']");

        expect(selectedMenuItem).toHaveClass("Mui-selected");
    });

    it("changes language and closes the menu when selecting another option", async () => {
        render(<LanguageMenu />);

        await userEvent.click(screen.getByRole("img", { name: "english flag" }));
        const menu = await screen.findByRole("menu");
        await userEvent.click(within(menu).getByRole("img", { name: "swedish flag" }));

        expect(setLanguageMock).toHaveBeenCalledTimes(1);
        expect(setLanguageMock).toHaveBeenCalledWith(Language.swedish);
        await waitFor(() => {
            expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        });
    });
});
