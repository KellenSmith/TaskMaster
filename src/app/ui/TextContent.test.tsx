import { render, screen } from "@testing-library/react";
import TextContent from "./TextContent";

const editableTextContentMock = vi.fn();

vi.mock("./EditableTextContent", () => ({
    __esModule: true,
    default: (props: { id: string; textContentPromise: Promise<unknown> }) => {
        editableTextContentMock(props);
        return <div data-testid="editable-text-content" />;
    },
}));

vi.mock("./ErrorBoundarySuspense", () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="error-boundary-suspense">{children}</div>
    ),
}));

describe("TextContent", () => {
    beforeEach(() => {
        editableTextContentMock.mockClear();
    });

    it("renders EditableTextContent inside ErrorBoundarySuspense", () => {
        const textContentPromise = Promise.resolve({
            id: "text-content-1",
            translations: [],
        } as any);

        render(<TextContent id="text-content-1" textContentPromise={textContentPromise} />);

        expect(screen.getByTestId("error-boundary-suspense")).toBeInTheDocument();
        expect(screen.getByTestId("editable-text-content")).toBeInTheDocument();
    });

    it("forwards id and textContentPromise to EditableTextContent", () => {
        const textContentPromise = Promise.resolve({
            id: "text-content-2",
            translations: [],
        } as any);

        render(<TextContent id="text-content-2" textContentPromise={textContentPromise} />);

        expect(editableTextContentMock).toHaveBeenCalledTimes(1);
        expect(editableTextContentMock).toHaveBeenCalledWith({
            id: "text-content-2",
            textContentPromise,
        });
    });
});
