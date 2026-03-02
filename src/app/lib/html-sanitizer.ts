import { richTextFields } from "../ui/form/FieldCfg";
import sanitizeHtml, { type IOptions } from "sanitize-html";

// Rich text sanitization configuration
const RICH_TEXT_CONFIG: IOptions = {
    // Allow common rich text elements
    allowedTags: [
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
    allowedAttributes: {
        "*": ["title", "class"],
        a: ["href", "target", "rel"],
        img: ["src", "alt", "width", "height"],
        td: ["colspan", "rowspan"],
        th: ["colspan", "rowspan"],
    },

    // Security configurations
    allowedSchemes: ["http", "https", "mailto", "tel", "callto", "sms", "cid", "xmpp"],
    allowProtocolRelative: false,

    // Additional security
    parser: {
        lowerCaseTags: false,
    },

    // Remove dangerous elements completely
    disallowedTagsMode: "discard",
    nonBooleanAttributes: [],
};

/**
 * Sanitizes HTML content for rich text fields
 * Removes dangerous elements while preserving formatting
 * SERVER-SIDE ONLY
 */
export const sanitizeRichText = (html: string): string => {
    if (!html || typeof html !== "string") {
        return "";
    }

    return sanitizeHtml(html, RICH_TEXT_CONFIG).trim();
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

    return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
};

/**
 * Sanitize rich text fields in form data
 * Use this in server actions before saving to database
 */
export const sanitizeFormData = <T extends Record<string, unknown>>(data: T): T => {
    return Object.keys(data).reduce((sanitized, key) => {
        const value = data[key];

        if (richTextFields.includes(key) && typeof value === "string") {
            (sanitized as T)[key as keyof T] = sanitizeRichText(value) as T[keyof T];
        } else {
            (sanitized as T)[key as keyof T] = value as T[keyof T];
        }

        return sanitized;
    }, {} as T);
};
