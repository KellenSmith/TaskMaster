import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "../../prisma/prisma-client";
import { Prisma } from "../../prisma/generated/client";

// Crockford-style alphabet without ambiguous characters (0/O, 1/I/L)
const USER_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const DEVICE_PAIRING_TTL_MINUTES = 5;

export const generateUserCode = (): string => {
    const randomChars = Array.from(crypto.randomBytes(8)).map(
        (byte) => USER_CODE_ALPHABET[byte % USER_CODE_ALPHABET.length],
    );
    return `${randomChars.slice(0, 4).join("")}-${randomChars.slice(4).join("")}`;
};

export const generateDeviceCode = (): string => crypto.randomBytes(32).toString("base64url");

export const getClientIp = (request: NextRequest): string | null => {
    // The client fully controls every hop it prepends to x-forwarded-for, and
    // x-real-ip/cf-connecting-ip are just as spoofable on this deployment (there's
    // no Cloudflare in front of it). The one entry a client cannot forge is the
    // *last* hop of x-forwarded-for, appended by the terminating edge/proxy that
    // actually observed the TCP peer - so that's the only value safe to use for
    // rate limiting. This is intentionally NOT the same "first entry" logic used
    // in payment-callback's getClientIp, which only feeds non-security-critical logs.
    const xForwardedFor = request.headers.get("x-forwarded-for");
    if (!xForwardedFor) return null;
    const hops = xForwardedFor
        .split(",")
        .map((ip) => ip.trim())
        .filter(Boolean);
    return hops.length > 0 ? hops[hops.length - 1] : null;
};

export const getDevicePairingRequestByUserCode = async (
    user_code: string,
): Promise<Prisma.DevicePairingRequestGetPayload<{
    select: { status: true; requesting_user_agent: true; expires_at: true };
}> | null> => {
    const pairingRequest = await prisma.devicePairingRequest.findUnique({
        where: { user_code },
        select: { status: true, requesting_user_agent: true, expires_at: true },
    });
    if (!pairingRequest) return null;
    if (pairingRequest.expires_at.getTime() < Date.now()) return null;
    return pairingRequest;
};
