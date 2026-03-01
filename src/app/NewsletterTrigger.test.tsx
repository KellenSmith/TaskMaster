import { render } from "@testing-library/react";
import NewsletterTrigger, { NEWSLETTER_PROCESS_INTERVAL } from "./NewsletterTrigger";
import * as newsletterActions from "./lib/mail-service/newsletter-actions";
import { vi } from "vitest";

// Mock the newsletter actions module
vi.mock("./lib/mail-service/newsletter-actions", () => ({
    processNextNewsletterBatch: vi.fn(),
}));

describe("NewsletterTrigger", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(1000000); // Arbitrary fixed time
    });

    it("should call processNextNewsletterBatch on mount", () => {
        render(<NewsletterTrigger />);
        expect(newsletterActions.processNextNewsletterBatch).toHaveBeenCalledTimes(1);
    });

    it("should not call processNextNewsletterBatch again within the interval", () => {
        const { rerender } = render(<NewsletterTrigger />);
        expect(newsletterActions.processNextNewsletterBatch).toHaveBeenCalledTimes(1);
        rerender(<NewsletterTrigger />);
        expect(newsletterActions.processNextNewsletterBatch).toHaveBeenCalledTimes(1);
    });

    it("should call processNextNewsletterBatch again after the interval passes", async () => {
        const { rerender } = render(<NewsletterTrigger />);
        expect(newsletterActions.processNextNewsletterBatch).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(NEWSLETTER_PROCESS_INTERVAL + 1);
        rerender(<NewsletterTrigger />);
        expect(newsletterActions.processNextNewsletterBatch).toHaveBeenCalledTimes(2);
    });

    it("should ignore errors from processNextNewsletterBatch", () => {
        vi.mocked(newsletterActions.processNextNewsletterBatch).mockImplementationOnce(() => {
            throw new Error("fail");
        });
        expect(() => render(<NewsletterTrigger />)).not.toThrow();
    });

    it("should render nothing", () => {
        const { container } = render(<NewsletterTrigger />);
        expect(container).toBeEmptyDOMElement();
    });
});
