import { describe, expect, it, vi, beforeEach } from "vitest";
import { prisma } from "../../prisma/prisma-client";
import { buildFormData } from "../../test/test-helpers";
import { Language } from "../../prisma/generated/enums";
import LanguageTranslations from "./LanguageTranslations";

vi.mock("./user-helpers", () => ({
    getLoggedInUser: vi.fn(),
    getUserLanguage: vi.fn(),
}));
vi.mock("./mail-service/mail-service", () => ({
    sendMail: vi.fn(),
}));

import { confirmDevicePairingRequest } from "./device-pairing-actions";
import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import { sendMail } from "./mail-service/mail-service";

const loggedInUser = { id: "user-1", email: "user@example.com" } as any;

beforeEach(() => {
    vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
});

describe("confirmDevicePairingRequest", () => {
    it("returns a localized error when the caller is not logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);

        const result = await confirmDevicePairingRequest(buildFormData({ user_code: "ABCD-EFGH" }));

        expect(result).toBe(LanguageTranslations.unauthorized[Language.english]);
        expect(prisma.devicePairingRequest.updateMany).not.toHaveBeenCalled();
    });

    it("claims the pairing request, sends a notification and returns void on success", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(loggedInUser);
        vi.mocked(prisma.devicePairingRequest.updateMany).mockResolvedValue({ count: 1 });
        vi.mocked(sendMail).mockResolvedValue(undefined as any);

        const result = await confirmDevicePairingRequest(buildFormData({ user_code: "abcd-efgh" }));

        expect(result).toBeUndefined();
        expect(prisma.devicePairingRequest.updateMany).toHaveBeenCalledWith({
            where: {
                user_code: "ABCD-EFGH",
                status: "pending",
                expires_at: { gt: expect.any(Date) },
            },
            data: { status: "confirmed", user_id: "user-1" },
        });
        expect(sendMail).toHaveBeenCalledWith(
            ["user@example.com"],
            expect.stringContaining("New device"),
            expect.anything(),
        );
    });

    it("returns a localized error when the code is expired, already used or invalid", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(loggedInUser);
        vi.mocked(prisma.devicePairingRequest.updateMany).mockResolvedValue({ count: 0 });

        const result = await confirmDevicePairingRequest(buildFormData({ user_code: "ABCD-EFGH" }));

        expect(result).toBe(LanguageTranslations.devicePairingExpiredOrInvalid[Language.english]);
        expect(sendMail).not.toHaveBeenCalled();
    });

    it("still succeeds even if the notification email fails to send", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(loggedInUser);
        vi.mocked(prisma.devicePairingRequest.updateMany).mockResolvedValue({ count: 1 });
        vi.mocked(sendMail).mockRejectedValue(new Error("smtp down"));
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        const result = await confirmDevicePairingRequest(buildFormData({ user_code: "ABCD-EFGH" }));

        expect(result).toBeUndefined();
        errorSpy.mockRestore();
    });

    it("throws on malformed user_code input", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(loggedInUser);

        await expect(
            confirmDevicePairingRequest(buildFormData({ user_code: "not-a-valid-code" })),
        ).rejects.toThrow();
    });
});
