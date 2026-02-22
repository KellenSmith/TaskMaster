import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import { buildFormData } from "../../test/test-helpers";
import * as locationActions from "./location-actions";
import { sanitizeFormData } from "./html-sanitizer";

vi.mock("./html-sanitizer", () => ({
    sanitizeFormData: vi.fn(),
}));

const locationId = "550e8400-e29b-41d4-a716-446655440000";

const baseLocationForm = {
    name: "Community Center",
    contact_person: "Jane Doe",
    rental_cost: "50",
    address: "123 Main St",
    capacity: "100",
    accessibility_info: "Wheelchair accessible",
    description: "<p>Large event hall</p>",
};

describe("location-actions", () => {
    describe("createLocation", () => {
        it("creates location, sanitizes, and revalidates", async () => {
            const sanitized = {
                name: "Community Center",
                contact_person: "Jane Doe",
                rental_cost: 50,
                address: "123 Main St",
                capacity: 100,
                accessibility_info: "Wheelchair accessible",
                description: "<p>Large event hall</p>",
            };
            const created = { id: locationId, ...sanitized };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.location.create.mockResolvedValue(created as any);

            const formData = buildFormData(baseLocationForm);

            const result = await locationActions.createLocation(formData);

            expect(vi.mocked(sanitizeFormData)).toHaveBeenCalledWith({
                name: "Community Center",
                contact_person: "Jane Doe",
                rental_cost: 50,
                address: "123 Main St",
                capacity: 100,
                accessibility_info: "Wheelchair accessible",
                description: "<p>Large event hall</p>",
            });
            expect(mockContext.prisma.location.create).toHaveBeenCalledWith({
                data: sanitized,
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.LOCATION, "max");
            expect(result).toEqual(created);
        });

        it("rejects invalid input", async () => {
            const formData = buildFormData({ name: "Test" });

            await expect(locationActions.createLocation(formData)).rejects.toThrow();
        });
    });

    describe("updateLocation", () => {
        it("updates location, sanitizes, and revalidates", async () => {
            const sanitized = {
                name: "Updated Center",
                address: "456 New St",
                capacity: 150,
            };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.location.update.mockResolvedValue({ id: locationId } as any);

            const formData = buildFormData({
                name: "Updated Center",
                address: "456 New St",
                capacity: "150",
            });

            await locationActions.updateLocation(locationId, formData);

            expect(vi.mocked(sanitizeFormData)).toHaveBeenCalled();
            expect(mockContext.prisma.location.update).toHaveBeenCalledWith({
                where: { id: locationId },
                data: sanitized,
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.LOCATION, "max");
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.EVENT, "max");
        });

        it("rejects invalid input", async () => {
            const formData = buildFormData({ capacity: "not-a-number" });

            await expect(locationActions.updateLocation(locationId, formData)).rejects.toThrow();
        });
    });

    describe("deleteLocation", () => {
        it("deletes location and revalidates", async () => {
            mockContext.prisma.location.delete.mockResolvedValue({ id: locationId } as any);

            await locationActions.deleteLocation(locationId);

            expect(mockContext.prisma.location.delete).toHaveBeenCalledWith({
                where: { id: locationId },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.LOCATION, "max");
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.EVENT, "max");
        });

        it("rejects invalid location id", async () => {
            await expect(locationActions.deleteLocation("not-a-uuid")).rejects.toThrow();
        });
    });
});
