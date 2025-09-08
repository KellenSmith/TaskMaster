/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            // Allow images from Vercel Blob storage
            ...(process.env.BLOB_HOSTNAME
                ? [
                      {
                          protocol: "https",
                          hostname: process.env.BLOB_HOSTNAME,
                          port: "",
                          pathname: "/**",
                      },
                  ]
                : []),
            // Fallback: allow all Vercel Blob storage subdomains if no specific hostname is set
            ...(!process.env.BLOB_HOSTNAME
                ? [
                      {
                          protocol: "https",
                          hostname: "*.public.blob.vercel-storage.com",
                          port: "",
                          pathname: "/**",
                      },
                  ]
                : []),
        ],
    },
    // async headers() {
    //     return [
    //         {
    //             // Apply security headers to all routes
    //             source: "/(.*)",
    //             headers: [
    //                 // Prevent clickjacking attacks
    //                 {
    //                     key: "X-Frame-Options",
    //                     value: "DENY",
    //                 },
    //                 // Prevent MIME type sniffing
    //                 {
    //                     key: "X-Content-Type-Options",
    //                     value: "nosniff",
    //                 },
    //                 // Control referrer information
    //                 {
    //                     key: "Referrer-Policy",
    //                     value: "strict-origin-when-cross-origin",
    //                 },
    //                 // Prevent XSS attacks
    //                 {
    //                     key: "X-XSS-Protection",
    //                     value: "1; mode=block",
    //                 },
    //                 // TODO: Content Security Policy
    //                 // {
    //                 //     key: "Content-Security-Policy",
    //                 //     value: [
    //                 //         "default-src 'self'",
    //                 //         "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for Next.js
    //                 //         "style-src 'self' 'unsafe-inline' fonts.googleapis.com", // Allow inline styles and Google Fonts
    //                 //         "font-src 'self' fonts.gstatic.com", // Allow Google Fonts
    //                 //         "img-src 'self' data: blob: https:", // Allow images from self, data URLs, and HTTPS
    //                 //         "connect-src 'self' https:", // Allow connections to self and HTTPS
    //                 //         "form-action 'self'", // Allow form submissions to same origin (required for Next.js Server Actions)
    //                 //         "object-src 'none'", // Disable plugins
    //                 //         "base-uri 'self'", // Restrict base tag
    //                 //         "frame-ancestors 'none'", // Prevent embedding (like X-Frame-Options)
    //                 //         "upgrade-insecure-requests", // Upgrade HTTP to HTTPS
    //                 //     ].join("; "),
    //                 // },
    //                 // Permissions Policy (formerly Feature Policy)
    //                 {
    //                     key: "Permissions-Policy",
    //                     value: [
    //                         "camera=()",
    //                         "microphone=()",
    //                         "geolocation=()",
    //                         "payment=(self)",
    //                         "usb=()",
    //                         "magnetometer=()",
    //                         "accelerometer=()",
    //                         "gyroscope=()",
    //                     ].join(", "),
    //                 },
    //             ],
    //         },
    //         {
    //             // Additional headers for API routes
    //             source: "/api/(.*)",
    //             headers: [
    //                 // Prevent caching of API responses
    //                 {
    //                     key: "Cache-Control",
    //                     value: "no-store, no-cache, must-revalidate, proxy-revalidate",
    //                 },
    //                 // Prevent CORS issues while maintaining security
    //                 {
    //                     key: "Access-Control-Allow-Origin",
    //                     value:
    //                         process.env.NODE_ENV === "production"
    //                             ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    //                                 ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    //                                 : "https://your-domain.com"
    //                             : "http://localhost:3000",
    //                 },
    //                 {
    //                     key: "Access-Control-Allow-Methods",
    //                     value: "GET, POST, PUT, DELETE, OPTIONS",
    //                 },
    //                 {
    //                     key: "Access-Control-Allow-Headers",
    //                     value: "Content-Type, Authorization",
    //                 },
    //             ],
    //         },
    //     ];
    // },
};

export default nextConfig;
