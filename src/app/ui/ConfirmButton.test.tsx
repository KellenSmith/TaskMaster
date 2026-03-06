import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmButton from "./ConfirmButton";
import { useUserContext } from "../context/UserContext";
import { Language } from "../../prisma/generated/enums";

describe("ConfirmButton", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.english,
        } as any);
    });

    it("renders the trigger button and keeps dialog closed initially", () => {
        render(
            <ConfirmButton onClick={vi.fn().mockResolvedValue(undefined)}>
                Delete item
            </ConfirmButton>,
        );

        expect(screen.getByRole("button", { name: "Delete item" })).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens confirmation dialog with default english copy", async () => {
        render(
            <ConfirmButton onClick={vi.fn().mockResolvedValue(undefined)}>
                Delete item
            </ConfirmButton>,
        );

        await userEvent.click(screen.getByRole("button", { name: "Delete item" }));

        expect(await screen.findByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Confirm")).toBeInTheDocument();
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Proceed" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("renders provided custom confirmation text", async () => {
        render(
            <ConfirmButton
                onClick={vi.fn().mockResolvedValue(undefined)}
                confirmText="This action cannot be undone"
            >
                Delete item
            </ConfirmButton>,
        );

        await userEvent.click(screen.getByRole("button", { name: "Delete item" }));

        expect(await screen.findByText("This action cannot be undone")).toBeInTheDocument();
        expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    });

    it("closes dialog on cancel without calling onClick", async () => {
        const onClick = vi.fn().mockResolvedValue(undefined);

        render(<ConfirmButton onClick={onClick}>Delete item</ConfirmButton>);

        await userEvent.click(screen.getByRole("button", { name: "Delete item" }));
        await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));

        await waitFor(() => {
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
        expect(onClick).not.toHaveBeenCalled();
    });

    it("calls onClick and closes dialog when proceeding", async () => {
        const onClick = vi.fn().mockResolvedValue(undefined);

        render(<ConfirmButton onClick={onClick}>Delete item</ConfirmButton>);

        await userEvent.click(screen.getByRole("button", { name: "Delete item" }));
        await userEvent.click(await screen.findByRole("button", { name: "Proceed" }));

        await waitFor(() => {
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });

    it("renders swedish translations", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.swedish,
        } as any);

        render(
            <ConfirmButton onClick={vi.fn().mockResolvedValue(undefined)}>Ta bort</ConfirmButton>,
        );

        await userEvent.click(screen.getByRole("button", { name: "Ta bort" }));

        expect(await screen.findByText("Bekräfta")).toBeInTheDocument();
        expect(screen.getByText("Är du säker?")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Fortsätt" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Avbryt" })).toBeInTheDocument();
    });
});
