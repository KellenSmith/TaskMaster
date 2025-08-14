import { describe, it, expect } from "vitest";
import { render, screen } from "../test/test-utils";
import Home from "./page";

describe("Home", () => {
    it("renders welcome message", async () => {
        render(<Home />);
        expect(
            await screen.findByText(`Welcome to ${process.env.NEXT_PUBLIC_ORG_NAME}`),
        ).toBeInTheDocument();
    });
});
