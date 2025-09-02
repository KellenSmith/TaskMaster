import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                // Minimal token generation: restrict to common image types and forward any clientPayload
                return {
                    allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify(clientPayload || {}),
                };
            },
            onUploadCompleted: async () => {
                // No-op: client will handle storing the blob.url in the DB
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}
