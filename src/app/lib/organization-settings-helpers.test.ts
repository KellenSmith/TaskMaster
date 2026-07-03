import { describe, expect, it } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import { getOrganizationSettings } from "./organization-settings-helpers";

describe("organization-settings-helpers", () => {
    describe("getOrganizationSettings", () => {
        it("returns existing organization settings when found", async () => {
            const existingSettings = { id: "org-1", logo_url: null } as any;
            mockContext.prisma.organizationSettings.findFirst.mockResolvedValue(existingSettings);

            const result = await getOrganizationSettings();

            expect(mockContext.prisma.organizationSettings.findFirst).toHaveBeenCalledTimes(1);
            expect(mockContext.prisma.organizationSettings.create).not.toHaveBeenCalled();
            expect(result).toBe(existingSettings);
        });

        it("returns organization settings with defaults when missing", async () => {
            const createdSettings = { id: "org-2", logo_url: null } as any;
            mockContext.prisma.organizationSettings.findFirst.mockResolvedValue(null);
            mockContext.prisma.organizationSettings.create.mockResolvedValue(createdSettings);

            const result = await getOrganizationSettings();

            expect(mockContext.prisma.organizationSettings.findFirst).toHaveBeenCalledTimes(1);
            expect(result).toStrictEqual({
                id: "default",
                logo_url: null,
                remind_membership_expires_in_days: 7,
                purge_members_after_days_unvalidated: 180,
                default_task_shift_length: 2,
                member_application_prompt: null,
                ticket_instructions: null,
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
});
