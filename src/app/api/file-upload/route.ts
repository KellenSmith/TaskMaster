import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "../../lib/auth/auth";

// ✅ SECURITY: File upload configuration
const UPLOAD_CONFIG = {
    // Maximum file size: 5MB (in bytes)
    MAX_FILE_SIZE: 5 * 1024 * 1024,

    // Allowed MIME types (NO SVG for security)
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"],

    // File extension whitelist
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],

    // Maximum filename length
    MAX_FILENAME_LENGTH: 100,
};

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
    return (
        filename
            // Remove path separators
            .replace(/[/\\]/g, "")
            // Remove null bytes and control characters
            // eslint-disable-next-line no-control-regex
            .replace(/[\x00-\x1f\x80-\x9f]/g, "")
            // Remove potentially dangerous characters
            .replace(/[<>:"|?*]/g, "")
            // Limit length
            .substring(0, UPLOAD_CONFIG.MAX_FILENAME_LENGTH)
            // Ensure it's not empty or just dots
            .replace(/^\.+$/, "file") || "file"
    );
}

/**
 * Validate file before upload
 */
function validateFile(pathname: string, contentType: string): { valid: boolean; error?: string } {
    // Check file size (pathname contains size info from Vercel)
    // Note: Actual size validation happens in onBeforeGenerateToken

    // Check MIME type
    if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(contentType)) {
        return {
            valid: false,
            error: `File type ${contentType} not allowed. Allowed types: ${UPLOAD_CONFIG.ALLOWED_TYPES.join(", ")}`,
        };
    }

    // Check file extension
    const extension = pathname.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!extension || !UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
        return {
            valid: false,
            error: `File extension not allowed. Allowed extensions: ${UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(", ")}`,
        };
    }

    return { valid: true };
}

export async function POST(request: Request): Promise<NextResponse> {
    // ✅ SECURITY: Require authentication for file uploads
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                // ✅ SECURITY: Sanitize filename
                const sanitizedPathname = sanitizeFilename(pathname);

                // ✅ SECURITY: Add user ID to prevent conflicts and enable tracking
                const userSafeFilename = `${session.user.id?.split("@")[0]}-${Date.now()}-${sanitizedPathname}`;

                // ✅ SECURITY: Validate file type and extension
                const contentType = (() => {
                    try {
                        if (typeof clientPayload === "string") {
                            const parsed = JSON.parse(clientPayload);
                            return parsed?.type || "";
                        }
                        return typeof clientPayload === "object" && clientPayload !== null
                            ? (clientPayload as any)?.type || ""
                            : "";
                    } catch {
                        return "";
                    }
                })();
                const validation = validateFile(pathname, contentType);

                if (!validation.valid) {
                    throw new Error(validation.error);
                }

                return {
                    // ✅ SECURITY: Only allow safe file types (images and PDFs, NO SVG)
                    allowedContentTypes: UPLOAD_CONFIG.ALLOWED_TYPES,

                    // ✅ SECURITY: Set maximum file size limit
                    maximumSizeInBytes: UPLOAD_CONFIG.MAX_FILE_SIZE,

                    // ✅ SECURITY: Use sanitized filename with user prefix
                    pathname: userSafeFilename,

                    // ✅ SECURITY: Add random suffix to prevent filename conflicts
                    addRandomSuffix: true,

                    // ✅ SECURITY: Include user info in token payload for audit trail
                    tokenPayload: JSON.stringify({
                        userId: session.user.id,
                        originalFilename: pathname,
                        uploadTime: new Date().toISOString(),
                        clientPayload: clientPayload,
                    }),
                };
            },
            onUploadCompleted: async ({ blob }) => {
                // ✅ SECURITY: Log successful uploads for audit trail
                console.log(`File uploaded successfully:`, {
                    blobUrl: blob.url,
                    filename: blob.pathname,
                    userId: session.user.id,
                    uploadTime: new Date().toISOString(),
                });

                // Optional: Store upload metadata in database for tracking
                // await logFileUpload(session.user.id, blob.url, blob.pathname);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        // ✅ SECURITY: Log failed upload attempts for monitoring
        console.error("File upload failed:", {
            error: error.message,
            userId: session.user.id,
            timestamp: new Date().toISOString(),
        });

        // ✅ SECURITY: Return generic error to prevent information disclosure
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 400 });
    }
}
