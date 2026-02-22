import { describe, expect, it } from "vitest";
import GlobalConstants from "../GlobalConstants";
import { sanitizeFormData, sanitizeRichText, stripAllHtml } from "./html-sanitizer";

describe("html-sanitizer", () => {
    describe("sanitizeRichText", () => {
        it("returns empty string for non-string input", () => {
            expect(sanitizeRichText("")).toBe("");
            expect(sanitizeRichText(null as unknown as string)).toBe("");
            expect(sanitizeRichText(undefined as unknown as string)).toBe("");
        });

        it("removes scripts and 'javascript:' protocols while preserving allowed tags", () => {
            const input =
                '<p>Safe <strong>bold</strong></p><script>alert(1)</script><a href="javascript:alert(2)">Click</a>';

            const result = sanitizeRichText(input);

            expect(result).toContain("<p>");
            expect(result).toContain("<strong>bold</strong>");
            expect(result).toContain("<a");
            expect(result).not.toContain("<script");
            expect(result).not.toContain("javascript:");
            expect(result).not.toContain("alert(1)");
        });

        it("strips dangerous attributes", () => {
            const input = '<img src="x" onerror="alert(1)" /><div style="color:red">Hi</div>';
            const result = sanitizeRichText(input);

            expect(result).toContain("<img");
            expect(result).toContain('src="x"');
            expect(result).not.toContain("onerror");
            expect(result).not.toContain("style=");
        });
    });

    describe("stripAllHtml", () => {
        it("removes all tags and keeps text", () => {
            const result = stripAllHtml("<p>Hello <strong>World</strong></p>");
            expect(result).toBe("Hello World");
            expect(result).not.toContain("<");
        });

        it("returns empty string for non-string input", () => {
            expect(stripAllHtml("")).toBe("");
            expect(stripAllHtml(null as unknown as string)).toBe("");
            expect(stripAllHtml(undefined as unknown as string)).toBe("");
        });
    });

    describe("sanitizeFormData", () => {
        it("sanitizes rich text fields and preserves other fields", () => {
            const input = {
                [GlobalConstants.TEXT]: "<p>Ok</p><script>alert(1)</script>",
                [GlobalConstants.DESCRIPTION]: '<div style="color:red">Desc</div>',
                [GlobalConstants.CONTENT]: '<a href="javascript:alert(2)">Click</a>',
                [GlobalConstants.TITLE]: "Plain Title",
                count: 2,
            };

            const result = sanitizeFormData(input);

            expect(result[GlobalConstants.TEXT]).toContain("<p>Ok</p>");
            expect(result[GlobalConstants.TEXT]).not.toContain("script");
            expect(result[GlobalConstants.DESCRIPTION]).not.toContain("style=");
            expect(result[GlobalConstants.CONTENT]).not.toContain("javascript:");
            expect(result[GlobalConstants.TITLE]).toBe("Plain Title");
            expect(result.count).toBe(2);
        });

        it("does not mutate the original object", () => {
            const input = {
                [GlobalConstants.TEXT]: "<p>Ok</p><script>alert(1)</script>",
                [GlobalConstants.TITLE]: "Plain",
            };

            const result = sanitizeFormData(input);

            expect(result).not.toBe(input);
            expect(input[GlobalConstants.TEXT]).toContain("<script>");
        });

        it("leaves non-string values unchanged for rich text fields", () => {
            const input = {
                [GlobalConstants.TEXT]: 123,
                [GlobalConstants.TITLE]: "Plain",
            } as unknown as Record<string, unknown>;

            const result = sanitizeFormData(input);

            expect(result[GlobalConstants.TEXT]).toBe(123);
        });
    });
});
