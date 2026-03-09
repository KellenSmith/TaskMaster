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

        it("creates organization settings with defaults when missing", async () => {
            const createdSettings = { id: "org-2", logo_url: null } as any;
            mockContext.prisma.organizationSettings.findFirst.mockResolvedValue(null);
            mockContext.prisma.organizationSettings.create.mockResolvedValue(createdSettings);

            const result = await getOrganizationSettings();

            expect(mockContext.prisma.organizationSettings.findFirst).toHaveBeenCalledTimes(1);
            expect(mockContext.prisma.organizationSettings.create).toHaveBeenCalledWith({
                data: {},
            });
            expect(result).toBe(createdSettings);
        });
    });
});
