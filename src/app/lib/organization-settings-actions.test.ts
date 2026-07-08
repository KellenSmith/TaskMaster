import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import { del } from "@vercel/blob";
import * as orgActions from "./organization-settings-actions";
import { getOrganizationSettings } from "./organization-settings-helpers";

vi.mock("@vercel/blob", () => ({
    del: vi.fn(),
}));

describe("organization-settings-actions", () => {
    describe("getOrganizationSettings", () => {
        it("returns existing organization settings when found", async () => {
            const existing = { id: "org-1", logo_url: null } as any;
            mockContext.prisma.organizationSettings.findFirst.mockResolvedValue(existing);

            const result = await getOrganizationSettings();

            expect(mockContext.prisma.organizationSettings.findFirst).toHaveBeenCalledTimes(1);
            expect(mockContext.prisma.organizationSettings.create).not.toHaveBeenCalled();
            expect(result).toBe(existing);
        });

        it("returns organization settings with defaults when missing", async () => {
            const created = { id: "org-2", logo_url: null } as any;
            mockContext.prisma.organizationSettings.findFirst.mockResolvedValue(null);
            mockContext.prisma.organizationSettings.create.mockResolvedValue(created);

            const result = await getOrganizationSettings();

            expect(result).toStrictEqual({
                id: "default",
                logo_url: null,
                remind_membership_expires_in_days: 7,
                purge_members_after_days_unvalidated: 180,
                default_task_shift_length: 2,
                member_application_prompt: null,
                payment_instructions: null,
                event_manager_email: null,
                primary_color: "#607d8b",
                privacy_policy_swedish_url: null,
                privacy_policy_english_url: null,
                terms_of_purchase_swedish_url: null,
                terms_of_purchase_english_url: null,
                terms_of_membership_swedish_url: null,
                terms_of_membership_english_url: null,
            });
        });
    });

    describe("updateOrganizationSettings", () => {
        it("updates settings, deletes old blob, and revalidates tag", async () => {
            const settings = {
                id: "org-1",
                logo_url: "https://blob.vercel-storage.com/old.png",
            } as any;
            mockContext.prisma.organizationSettings.findFirst.mockResolvedValue(settings);

            const formData = new FormData();
            formData.set("event_manager_email", "");
            formData.set("primary_color", "#fff");
            formData.set("logo_url", "https://blob.vercel-storage.com/new.png");

            await orgActions.updateOrganizationSettings(formData);

            expect(mockContext.prisma.organizationSettings.findFirst).toHaveBeenCalledTimes(1);
            expect(mockContext.prisma.organizationSettings.upsert).toHaveBeenCalledWith({
                where: { id: "org-1" },
                create: {
                    event_manager_email: "",
                    primary_color: "#fff",
                    logo_url: "https://blob.vercel-storage.com/new.png",
                },
                update: {
                    event_manager_email: "",
                    primary_color: "#fff",
                    logo_url: "https://blob.vercel-storage.com/new.png",
                },
            });
            expect(vi.mocked(del)).toHaveBeenCalledWith("https://blob.vercel-storage.com/old.png");
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.ORGANIZATION_SETTINGS,
                "max",
            );
        });
    });

    describe("deleteOldBlob", () => {
        it("deletes old vercel blob when url changes", async () => {
            await orgActions.deleteOldBlob(
                "https://blob.vercel-storage.com/old.png",
                "https://blob.vercel-storage.com/new.png",
            );

            expect(vi.mocked(del)).toHaveBeenCalledWith("https://blob.vercel-storage.com/old.png");
        });

        it("does not delete when old url is missing or unchanged", async () => {
            await orgActions.deleteOldBlob(null, "https://blob.vercel-storage.com/new.png");
            await orgActions.deleteOldBlob(
                "https://blob.vercel-storage.com/same.png",
                "https://blob.vercel-storage.com/same.png",
            );

            expect(vi.mocked(del)).not.toHaveBeenCalled();
        });

        it("swallows errors from blob deletion", async () => {
            vi.mocked(del).mockRejectedValueOnce(new Error("delete failed"));
            const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

            await expect(
                orgActions.deleteOldBlob(
                    "https://blob.vercel-storage.com/old.png",
                    "https://blob.vercel-storage.com/new.png",
                ),
            ).resolves.toBeUndefined();

            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });
});
