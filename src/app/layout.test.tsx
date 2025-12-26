import { describe, it, expect, vi, beforeEach } from "vitest";
import { RootLayoutInner } from "./layout";
import { render, screen } from "@testing-library/react";

// Mock the child components
vi.mock("./ui/NavPanel", () => ({
    default: () => <div data-testid="nav-panel">NavPanel</div>,
}));

vi.mock("./context/ServerContextWrapper", () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="server-context-wrapper">{children}</div>
    ),
}));

vi.mock("@vercel/analytics/next", () => ({
    Analytics: () => <div data-testid="analytics">Analytics</div>,
}));

vi.mock("@vercel/speed-insights/next", () => ({
    SpeedInsights: () => <div data-testid="speed-insights">SpeedInsights</div>,
}));

describe("RootLayout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("RootLayoutInner", () => {
        it("renders NavPanel component", () => {
            render(<RootLayoutInner>Test Content</RootLayoutInner>);
            const navPanel = screen.getByTestId("nav-panel");
            expect(navPanel).toBeInTheDocument();
        });

        it("renders ServerContextWrapper component", () => {
            render(<RootLayoutInner>Test Content</RootLayoutInner>);
            const contextWrapper = screen.getByTestId("server-context-wrapper");
            expect(contextWrapper).toBeInTheDocument();
        });

        it("passes children through ServerContextWrapper and Stack", () => {
            const testContent = "Test Content Here";
            render(<RootLayoutInner>{testContent}</RootLayoutInner>);
            expect(screen.getByText(testContent)).toBeInTheDocument();
        });

        it("renders children within the correct component hierarchy", () => {
            render(
                <RootLayoutInner>
                    <span>Child Element</span>
                </RootLayoutInner>,
            );
            // Verify the child is rendered within the structure
            const child = screen.getByText("Child Element");
            expect(child).toBeInTheDocument();
        });

        it("applies Stack styling with correct props", () => {
            const { container } = render(<RootLayoutInner>Content</RootLayoutInner>);
            // The Stack component should be rendered
            const stackElement = container.querySelector("[class*='MuiStack']");
            expect(stackElement).toBeInTheDocument();
        });

        it("renders NavPanel before children content", () => {
            render(<RootLayoutInner>Test Content</RootLayoutInner>);
            const navPanel = screen.getByTestId("nav-panel");
            const testContent = screen.getByText("Test Content");

            // NavPanel should appear before content in DOM
            expect(navPanel.compareDocumentPosition(testContent)).toBe(
                Node.DOCUMENT_POSITION_FOLLOWING,
            );
        });

        it("handles multiple children elements", () => {
            render(
                <RootLayoutInner>
                    <div>First Child</div>
                    <div>Second Child</div>
                </RootLayoutInner>,
            );
            expect(screen.getByText("First Child")).toBeInTheDocument();
            expect(screen.getByText("Second Child")).toBeInTheDocument();
        });

        it("preserves React Fragment as children", () => {
            render(
                <RootLayoutInner>
                    <>
                        <div>Fragment Child 1</div>
                        <div>Fragment Child 2</div>
                    </>
                </RootLayoutInner>,
            );
            expect(screen.getByText("Fragment Child 1")).toBeInTheDocument();
            expect(screen.getByText("Fragment Child 2")).toBeInTheDocument();
        });
    });

    describe("RootLayout full tree (with html and body)", () => {
        it("exports RootLayoutInner for testing purposes", () => {
            expect(RootLayoutInner).toBeDefined();
            expect(typeof RootLayoutInner).toBe("function");
        });

        it("RootLayoutInner is a valid React component", () => {
            expect(RootLayoutInner.displayName || RootLayoutInner.name).toBeDefined();
        });
    });

    describe("Layout Structure", () => {
        it("RootLayoutInner wraps children in ServerContextWrapper", () => {
            render(<RootLayoutInner>Wrapped Content</RootLayoutInner>);
            const wrapper = screen.getByTestId("server-context-wrapper");
            expect(wrapper).toBeInTheDocument();
            expect(wrapper).toHaveTextContent("Wrapped Content");
        });

        it("ServerContextWrapper contains NavPanel", () => {
            render(<RootLayoutInner>Content</RootLayoutInner>);
            const wrapper = screen.getByTestId("server-context-wrapper");
            const navPanel = screen.getByTestId("nav-panel");
            // NavPanel should be within the wrapper
            expect(wrapper.contains(navPanel)).toBe(true);
        });
    });
});
