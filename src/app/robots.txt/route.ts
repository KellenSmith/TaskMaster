import { NextResponse } from "next/server";

export function GET() {
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";

    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /settings/
Disallow: /profile/
Disallow: /orders/
Disallow: /tasks/
Disallow: /members/
Disallow: /apply/
Disallow: /calendar-post/
Disallow: /sendout/
Disallow: /info_page/
Disallow: /locations/
Disallow: /products/
Disallow: /calendar/
Disallow: /skill_badges/
Disallow: /year-wheel/

# Allow public pages
Allow: /contact/
Allow: /shop/
Allow: /login/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml`;

    return new NextResponse(robotsTxt, {
        headers: {
            "Content-Type": "text/plain",
        },
    });
}
