import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getAbsoluteUrl } from "../../../lib/utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ event_participant_id: string }> }
) {

    try {
        const { event_participant_id } = await params;
        // Decode the QR code parameter (in case it's URL encoded)
        const decodedText = decodeURIComponent(event_participant_id);

        const uri = getAbsoluteUrl(["ticket"], { eventParticipantId: decodedText });

        // Generate QR code as PNG buffer
        const qrCodeBuffer = await QRCode.toBuffer(uri, {
            type: "png",
            width: 300,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#FFFFFF",
            },
        });

        // Return the QR code image
        return new NextResponse(new Uint8Array(qrCodeBuffer), {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Error generating QR code:", error);
        return new NextResponse("Error generating QR code", { status: 500 });
    }
}
