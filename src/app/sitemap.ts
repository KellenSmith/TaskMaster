import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || "https://taskmaster.com";

    // Static pages
    const staticPages = ["", "/apply", "/login", "/contact"];

    // Generate sitemap entries
    const sitemap: MetadataRoute.Sitemap = staticPages.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: "2026-05-26",
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.8,
    }));

    // TODO: Add dynamic pages
    // You can add dynamic pages here by fetching from your database
    // Example:
    // const products = await getPublicProducts()
    // products.forEach(product => {
    //   sitemap.push({
    //     url: `${baseUrl}/products/${product.slug}`,
    //     lastModified: "2026-05-26",
    //     changeFrequency: 'weekly',
    //     priority: 0.6,
    //   })
    // })

    return sitemap;
}
