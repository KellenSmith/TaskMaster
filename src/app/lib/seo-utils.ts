import { Metadata } from "next";

interface GenerateMetadataProps {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
}

export function generateSEOMetadata({
    title,
    description,
    keywords = [],
    ogImage,
    canonicalUrl,
    noIndex = false,
}: GenerateMetadataProps): Metadata {
    const baseTitle = process.env.NEXT_PUBLIC_ORG_NAME || "TaskMaster";
    const baseDescription =
        process.env.NEXT_PUBLIC_ORG_DESCRIPTION ||
        "Professional volunteer and task management platform";
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";

    // Parse keywords from environment variable
    const envKeywords = process.env.NEXT_PUBLIC_SEO_KEYWORDS
        ? process.env.NEXT_PUBLIC_SEO_KEYWORDS.split(",").map((k) => k.trim())
        : ["volunteer management", "task management", "organization", "events", "scheduling"];

    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    const metaDescription = description || baseDescription;
    const allKeywords = [...envKeywords, ...keywords];

    return {
        title: fullTitle,
        description: metaDescription,
        keywords: allKeywords.join(", "),
        authors: [{ name: baseTitle }],
        creator: baseTitle,
        publisher: baseTitle,
        robots: noIndex ? "noindex, nofollow" : "index, follow",

        // Open Graph
        openGraph: {
            title: fullTitle,
            description: metaDescription,
            url: canonicalUrl || baseUrl,
            siteName: baseTitle,
            images: ogImage
                ? [
                      {
                          url: ogImage,
                          width: 1200,
                          height: 630,
                          alt: fullTitle,
                      },
                  ]
                : [],
            locale: "en_US",
            type: "website",
        },

        // Twitter
        twitter: {
            card: "summary_large_image",
            title: fullTitle,
            description: metaDescription,
            images: ogImage ? [ogImage] : [],
        },

        // Additional
        ...(canonicalUrl && {
            alternates: {
                canonical: canonicalUrl,
            },
        }),

        // Verification (add your verification codes)
        verification: {
            google: process.env.GOOGLE_SITE_VERIFICATION,
            // yandex: 'your-yandex-verification',
            // bing: 'your-bing-verification',
        },
    };
}
