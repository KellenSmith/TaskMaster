import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import EditableTextContent from "./EditableTextContent";
import { useUserContext } from "../context/UserContext";
import { Language } from "../../prisma/generated/enums";
import { updateTextContent } from "../lib/text-content-actions";
import NotificationContextProvider from "../context/NotificationContext";

vi.mock("../lib/text-content-actions", () => ({
    updateTextContent: vi.fn(),
}));

const createTextContent = (translations: Array<{ language: Language; text: string }>) =>
    ({
        id: "text-content-1",
        translations,
    }) as any;

const toFulfilledThenable = <T,>(value: T) =>
    ({
        status: "fulfilled",
        value,
        then: (onFulfilled?: (resolved: T) => unknown) => Promise.resolve(onFulfilled?.(value)),
    }) as unknown as Promise<T>;

const renderEditableTextContent = (textContentPromise: Promise<any>) => {
    render(
        <NotificationContextProvider>
            <Suspense fallback={<div>Loading text</div>}>
                <EditableTextContent id="text-content-1" textContentPromise={textContentPromise} />
            </Suspense>
        </NotificationContextProvider>,
    );
};

describe("EditableTextContent", () => {
    beforeEach(() => {
        vi.mocked(updateTextContent).mockResolvedValue(undefined as any);
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.english,
            editMode: false,
        } as any);
    });

    it("renders the translation matching current language", async () => {
        renderEditableTextContent(
            toFulfilledThenable(
                createTextContent([
                    { language: Language.english, text: "<p>English content</p>" },
                    { language: Language.swedish, text: "<p>Svenskt innehåll</p>" },
                ]),
            ),
        );

        const textInput = document.querySelector("input[name='text']") as HTMLInputElement;
        expect(textInput).toBeInTheDocument();
        expect(textInput.value).toBe("<p>English content</p>");
    });

    it("renders swedish translation when language is swedish", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.swedish,
            editMode: false,
        } as any);

        renderEditableTextContent(
            toFulfilledThenable(
                createTextContent([
                    { language: Language.english, text: "<p>English content</p>" },
                    { language: Language.swedish, text: "<p>Svenskt innehåll</p>" },
                ]),
            ),
        );

        const textInput = document.querySelector("input[name='text']") as HTMLInputElement;
        expect(textInput).toBeInTheDocument();
        expect(textInput.value).toBe("<p>Svenskt innehåll</p>");
    });

    it("does not expose edit controls when website edit mode is disabled", async () => {
        renderEditableTextContent(
            toFulfilledThenable(
                createTextContent([{ language: Language.english, text: "<p>Read only</p>" }]),
            ),
        );

        const textInput = document.querySelector("input[name='text']") as HTMLInputElement;
        expect(textInput).toBeInTheDocument();
        expect(textInput.value).toBe("<p>Read only</p>");

        const editButton = screen
            .queryAllByRole("button")
            .find((button) => button.querySelector("svg[data-testid='EditIcon']"));
        expect(editButton).toBeUndefined();
        expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    });

    it("submits updated text content using id and current language", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.english,
            editMode: false,
        } as any);

        renderEditableTextContent(
            toFulfilledThenable(
                createTextContent([
                    { language: Language.english, text: "<p>Editable content</p>" },
                ]),
            ),
        );

        const textInput = document.querySelector("input[name='text']") as HTMLInputElement;
        expect(textInput).toBeInTheDocument();
        expect(textInput.value).toBe("<p>Editable content</p>");

        const form = document.querySelector("form") as HTMLFormElement;
        expect(form).toBeInTheDocument();
        fireEvent.submit(form);

        await waitFor(() => {
            expect(updateTextContent).toHaveBeenCalledWith(
                "text-content-1",
                Language.english,
                "<p>Editable content</p>",
            );
        });
        expect(await screen.findByText("Updated successfully")).toBeInTheDocument();
    });
});
