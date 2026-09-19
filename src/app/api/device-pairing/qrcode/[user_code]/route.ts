import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getAbsoluteUrl } from "../../../../lib/utils";
import GlobalConstants from "../../../../GlobalConstants";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ user_code: string }> },
) {
    try {
        const { user_code } = await params;
        const decodedUserCode = decodeURIComponent(user_code);

        const uri = getAbsoluteUrl([GlobalConstants.LOGIN, GlobalConstants.APPROVE, decodedUserCode]);

        const qrCodeBuffer = await QRCode.toBuffer(uri, {
            type: "png",
            width: 300,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#FFFFFF",
            },
        });

        return new NextResponse(new Uint8Array(qrCodeBuffer), {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Error generating device pairing QR code:", error);
        return new NextResponse("Error generating QR code", { status: 500 });
    }
}
