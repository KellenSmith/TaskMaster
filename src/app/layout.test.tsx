import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "../test/test-utils";

// Mock NavPanel before importing the layout so the mock is used
const mockNavPanel = vi.fn();
vi.mock("./ui/NavPanel", () => ({
    default: (props: any) => {
        mockNavPanel(props);
        return React.createElement("div", { "data-testid": "navpanel-mock" });
    },
}));

// Mock ServerContextWrapper to capture usage and render children
const mockServerContextWrapper = vi.fn();
vi.mock("./context/ServerContextWrapper", () => ({
    __esModule: true,
    default: (props: any) => {
        mockServerContextWrapper(props);
        return React.createElement("div", { "data-testid": "servercontext-mock" }, props.children);
    },
}));

import { RootLayoutInner, metadata } from "./layout";

describe("RootLayout", () => {
    it("renders NavPanel and passes children through ServerContextWrapper", () => {
        const jsx = RootLayoutInner({
            children: React.createElement("div", { "data-testid": "child" }, "child-content"),
        });
        render(jsx as any);

        expect(mockNavPanel).toHaveBeenCalledTimes(1);
        expect(mockServerContextWrapper).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("navpanel-mock")).toBeTruthy();
        expect(screen.getByTestId("child")).toHaveTextContent("child-content");
    });

    it("exports metadata with title and description strings", () => {
        expect(metadata).toBeDefined();
        expect(typeof metadata.title).toBe("string");
        expect(typeof metadata.description).toBe("string");
    });
});
