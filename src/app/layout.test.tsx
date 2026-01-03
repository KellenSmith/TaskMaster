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
    describe("RootLayoutInner", () => {
        it("renders required components (NavPanel and ServerContextWrapper)", () => {
            render(<RootLayoutInner>Test Content</RootLayoutInner>);
            expect(screen.getByTestId("nav-panel")).toBeInTheDocument();
            expect(screen.getByTestId("server-context-wrapper")).toBeInTheDocument();
        });

        it("renders children correctly", () => {
            render(<RootLayoutInner>Test Content</RootLayoutInner>);
            expect(screen.getByText("Test Content")).toBeInTheDocument();
        });

        it("renders multiple children elements", () => {
            render(
                <RootLayoutInner>
                    <div>First Child</div>
                    <div>Second Child</div>
                </RootLayoutInner>,
            );
            expect(screen.getByText("First Child")).toBeInTheDocument();
            expect(screen.getByText("Second Child")).toBeInTheDocument();
        });

        it("renders children passed as React Fragment", () => {
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

        it("wraps children in ServerContextWrapper which contains NavPanel", () => {
            render(<RootLayoutInner>Wrapped Content</RootLayoutInner>);
            const wrapper = screen.getByTestId("server-context-wrapper");
            const navPanel = screen.getByTestId("nav-panel");

            expect(wrapper.contains(navPanel)).toBe(true);
            expect(wrapper).toHaveTextContent("Wrapped Content");
        });
    });
});
