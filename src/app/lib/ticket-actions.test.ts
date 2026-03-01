import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import { buildFormData } from "../../test/test-helpers";
import * as ticketActions from "./ticket-actions";

vi.mock("./organization-settings-actions", () => ({
    deleteOldBlob: vi.fn(),
}));

const eventId = "550e8400-e29b-41d4-a716-446655440000";
const ticketId = "550e8400-e29b-41d4-a716-446655440001";

const baseTicketForm = {
    type: "standard",
    event_id: eventId,
    name: "General Admission",
    description: "Entry ticket",
    price: "100",
    vat_percentage: "6",
    stock: "10",
    image_url: "https://example.com/ticket.png",
};

describe("ticket-actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createEventTicket", () => {
        it("creates a ticket with remaining stock and revalidates", async () => {
            mockContext.prisma.eventParticipant.count.mockResolvedValue(3);
            mockContext.prisma.event.findFirstOrThrow.mockResolvedValue({
                max_participants: 10,
            } as any);
            mockContext.prisma.ticket.create.mockResolvedValue({ product_id: ticketId } as any);

            const formData = buildFormData(baseTicketForm);

            await ticketActions.createEventTicket(eventId, formData);

            expect(mockContext.prisma.eventParticipant.count).toHaveBeenCalledWith({
                where: {
                    ticket: { event_id: eventId },
                },
            });
            expect(mockContext.prisma.event.findFirstOrThrow).toHaveBeenCalledWith({
                where: { id: eventId },
                select: { max_participants: true },
            });
            expect(mockContext.prisma.ticket.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    event: { connect: { id: eventId } },
                    product: {
                        create: expect.objectContaining({
                            stock: 7,
                        }),
                    },
                }),
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TICKET, "max");
        });

        it("rejects invalid event id", async () => {
            const formData = buildFormData(baseTicketForm);

            await expect(ticketActions.createEventTicket("not-a-uuid", formData)).rejects.toThrow();
        });

        it("rejects invalid form data", async () => {
            const formData = buildFormData({ name: "bad" });

            await expect(ticketActions.createEventTicket(eventId, formData)).rejects.toThrow();
        });
    });

    describe("updateEventTicket", () => {
        it("updates ticket and revalidates", async () => {
            const formData = buildFormData({
                ...baseTicketForm,
                price: "150",
                stock: "5",
            });

            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue({
                id: ticketId,
                image_url: "https://example.com/ticket.png",
            } as any);
            mockContext.prisma.ticket.update.mockResolvedValue({ product_id: ticketId } as any);

            await ticketActions.updateEventTicket(ticketId, formData);

            expect(mockContext.prisma.ticket.update).toHaveBeenCalledWith({
                where: { product_id: ticketId },
                data: expect.objectContaining({
                    product: {
                        update: expect.objectContaining({
                            price: 15000,
                            stock: 5,
                        }),
                    },
                }),
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TICKET, "max");
        });

        it("deletes old blob when updating image URL", async () => {
            const { deleteOldBlob } = await import("./organization-settings-actions");
            const oldImageUrl = "https://example.com/old-ticket.png";
            const newImageUrl = "https://example.com/new-ticket.png";

            const formData = buildFormData({
                ...baseTicketForm,
                image_url: newImageUrl,
            });

            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue({
                id: ticketId,
                image_url: oldImageUrl,
            } as any);

            mockContext.prisma.ticket.update.mockResolvedValue({ product_id: ticketId } as any);

            await ticketActions.updateEventTicket(ticketId, formData);

            expect(deleteOldBlob).toHaveBeenCalledWith(oldImageUrl, newImageUrl);
        });

        it("deletes old blob when removing image URL", async () => {
            const { deleteOldBlob } = await import("./organization-settings-actions");
            const oldImageUrl = "https://example.com/old-ticket.png";

            const formData = buildFormData({
                ...baseTicketForm,
                image_url: "",
            });

            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue({
                id: ticketId,
                image_url: oldImageUrl,
            } as any);

            mockContext.prisma.ticket.update.mockResolvedValue({ product_id: ticketId } as any);

            await ticketActions.updateEventTicket(ticketId, formData);

            expect(deleteOldBlob).toHaveBeenCalledWith(oldImageUrl, "");
        });

        it("does not delete blob when image_url not in update", async () => {
            const { deleteOldBlob } = await import("./organization-settings-actions");
            const oldImageUrl = "https://example.com/old-ticket.png";

            const formDataObject: Partial<typeof baseTicketForm> = {
                ...baseTicketForm,
                vat_percentage: "6",
            };
            delete formDataObject.image_url;

            const formData = buildFormData(formDataObject);

            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue({
                id: ticketId,
                image_url: oldImageUrl,
            } as any);

            mockContext.prisma.ticket.update.mockResolvedValue({ product_id: ticketId } as any);

            await ticketActions.updateEventTicket(ticketId, formData);

            expect(deleteOldBlob).not.toHaveBeenCalled();
        });

        it("rejects invalid ticket id", async () => {
            const formData = buildFormData(baseTicketForm);

            await expect(ticketActions.updateEventTicket("not-a-uuid", formData)).rejects.toThrow();
        });

        it("rejects invalid form data", async () => {
            const formData = buildFormData({ name: "bad" });

            await expect(ticketActions.updateEventTicket(ticketId, formData)).rejects.toThrow();
        });
    });

    describe("deleteEventTicket", () => {
        it("deletes ticket product and revalidates", async () => {
            mockContext.prisma.product.delete.mockResolvedValue({ id: ticketId } as any);

            await ticketActions.deleteEventTicket(ticketId);

            expect(mockContext.prisma.product.delete).toHaveBeenCalledWith({
                where: { id: ticketId },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TICKET, "max");
        });

        it("rejects invalid ticket id", async () => {
            await expect(ticketActions.deleteEventTicket("not-a-uuid")).rejects.toThrow();
        });
    });
});
