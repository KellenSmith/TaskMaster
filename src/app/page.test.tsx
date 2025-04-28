import { describe, it, expect } from "vitest";
import { render, screen } from "../test/test-utils";
import Home from "./page";

describe("Home", () => {
    it("renders welcome message", () => {
        render(<Home />);
        expect(
            screen.getByText(`Welcome to ${process.env.NEXT_PUBLIC_ORG_NAME}`),
        ).toBeInTheDocument();
    });
});
