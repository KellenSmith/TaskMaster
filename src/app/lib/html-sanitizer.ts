"use server";

import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Rich text sanitization configuration
const RICH_TEXT_CONFIG: DOMPurify.Config = {
    // Allow common rich text elements
    ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "s",
        "sub",
        "sup",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "code",
        "a",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "hr",
        "div",
        "span",
    ],

    // Allow safe attributes
    ALLOWED_ATTR: [
        "href",
        "target",
        "rel",
        "src",
        "alt",
        "width",
        "height",
        "title",
        "class",
        "colspan",
        "rowspan",
    ],

    // Security configurations
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOW_SELF_CLOSE_IN_ATTR: false,

    // URL validation
    ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,

    // Additional security
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,

    // Remove dangerous elements completely
    FORBID_TAGS: ["script", "object", "embed", "style", "link", "meta", "title"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "style"],
};

// Create a server-side DOMPurify instance
const { window } = new JSDOM("");
const purify = DOMPurify(window as any);

/**
 * Sanitizes HTML content for rich text fields
 * Removes dangerous elements while preserving formatting
 * SERVER-SIDE ONLY
 */
export const sanitizeRichText = (html: string): string => {
    if (!html || typeof html !== "string") {
        return "";
    }

    // First pass: sanitize with our configuration
    let sanitized = purify.sanitize(html, RICH_TEXT_CONFIG);

    // Additional security: ensure no javascript: protocols snuck through
    sanitized = sanitized.replace(/javascript:/gi, "");

    // Remove any remaining script tags that might have been nested
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    return sanitized.trim();
};

/**
 * Strips all HTML tags, leaving only plain text
 * Use for fields that should never contain HTML
 * SERVER-SIDE ONLY
 */
export const stripAllHtml = (html: string): string => {
    if (!html || typeof html !== "string") {
        return "";
    }

    return purify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Sanitize rich text fields in form data
 * Use this in server actions before saving to database
 */
export const sanitizeFormData = <T extends Record<string, any>>(
    data: T,
    richTextFields: (keyof T)[],
): T => {
    const sanitized = { ...data };

    for (const field of richTextFields) {
        if (sanitized[field] && typeof sanitized[field] === "string") {
            sanitized[field] = sanitizeRichText(sanitized[field] as string) as T[keyof T];
        }
    }

    return sanitized;
};
