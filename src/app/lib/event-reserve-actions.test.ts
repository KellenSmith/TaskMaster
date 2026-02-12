import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import type { TransactionClient } from "../../test/types/test-types";
import * as eventReserveActions from "./event-reserve-actions";

const userId = "550e8400-e29b-41d4-a716-446655440001";
const eventId = "550e8400-e29b-41d4-a716-446655440002";

describe("event-reserve-actions", () => {
    describe("addEventReserveWithTx", () => {
        const tx = mockContext.prisma as any as TransactionClient;

        beforeEach(() => {
            tx.eventParticipant.findFirst.mockResolvedValue(null);
        });

        it("adds event reserve successfully when user is not a participant", async () => {
            await eventReserveActions.addEventReserveWithTx(tx as any, userId, eventId);

            expect(tx.eventParticipant.findFirst).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    ticket: {
                        event_id: eventId,
                    },
                },
            });
            expect(tx.eventReserve.upsert).toHaveBeenCalledWith({
                where: {
                    user_id_event_id: {
                        user_id: userId,
                        event_id: eventId,
                    },
                },
                create: {
                    user: {
                        connect: {
                            id: userId,
                        },
                    },
                    event: {
                        connect: {
                            id: eventId,
                        },
                    },
                },
                update: {},
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.RESERVE_USERS,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.EVENT,
                "max",
            );
        });

        it("throws error when user is already a participant", async () => {
            tx.eventParticipant.findFirst.mockResolvedValue({
                id: "participant-id",
                user_id: userId,
            } as any);

            await expect(
                eventReserveActions.addEventReserveWithTx(tx as any, userId, eventId),
            ).rejects.toThrow("User is already a participant in the event");

            expect(tx.eventReserve.upsert).not.toHaveBeenCalled();
        });

        it("upserts existing reserve without error", async () => {
            // Upsert should handle existing reserves gracefully with empty update
            await eventReserveActions.addEventReserveWithTx(tx as any, userId, eventId);

            expect(tx.eventReserve.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    update: {},
                }),
            );
        });
    });

    describe("addEventReserve", () => {
        const tx = mockContext.prisma as any as TransactionClient;

        beforeEach(() => {
            mockContext.prisma.$transaction.mockImplementation(async (callback) => callback(tx));
            tx.eventParticipant.findFirst.mockResolvedValue(null);
        });

        it("calls transaction wrapper with addEventReserveWithTx", async () => {
            await eventReserveActions.addEventReserve(userId, eventId);

            expect(mockContext.prisma.$transaction).toHaveBeenCalled();
            expect(tx.eventReserve.upsert).toHaveBeenCalled();
        });

        it("validates user ID before transaction", async () => {
            await expect(
                eventReserveActions.addEventReserve("invalid-id", eventId),
            ).rejects.toThrow();

            // Transaction should not be called if validation fails
            expect(mockContext.prisma.$transaction).not.toHaveBeenCalled();
        });

        it("validates event ID before transaction", async () => {
            await expect(
                eventReserveActions.addEventReserve(userId, "invalid-id"),
            ).rejects.toThrow();

            // Transaction should not be called if validation fails
            expect(mockContext.prisma.$transaction).not.toHaveBeenCalled();
        });

        it("propagates errors from transaction", async () => {
            tx.eventParticipant.findFirst.mockResolvedValue({
                id: "participant-id",
                user_id: userId,
            } as any);

            await expect(
                eventReserveActions.addEventReserve(userId, eventId),
            ).rejects.toThrow("User is already a participant in the event");
        });
    });

    describe("deleteEventReserveWithTx", () => {
        const tx = mockContext.prisma as any as TransactionClient;

        it("deletes event reserve successfully", async () => {
            await eventReserveActions.deleteEventReserveWithTx(tx as any, userId, eventId);

            expect(tx.eventReserve.deleteMany).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    event_id: eventId,
                },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.RESERVE_USERS,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.EVENT,
                "max",
            );
        });

        it("uses deleteMany to avoid errors when reserve does not exist", async () => {
            tx.eventReserve.deleteMany.mockResolvedValue({ count: 0 } as any);

            await eventReserveActions.deleteEventReserveWithTx(tx as any, userId, eventId);

            expect(tx.eventReserve.deleteMany).toHaveBeenCalled();
            // Should not throw even if nothing was deleted
        });

        it("successfully deletes existing reserve", async () => {
            tx.eventReserve.deleteMany.mockResolvedValue({ count: 1 } as any);

            await eventReserveActions.deleteEventReserveWithTx(tx as any, userId, eventId);

            expect(tx.eventReserve.deleteMany).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    event_id: eventId,
                },
            });
        });

        it("revalidates cache even when no reserve exists", async () => {
            tx.eventReserve.deleteMany.mockResolvedValue({ count: 0 } as any);

            await eventReserveActions.deleteEventReserveWithTx(tx as any, userId, eventId);

            // Should still revalidate cache
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.RESERVE_USERS,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.EVENT,
                "max",
            );
        });
    });

    describe("deleteEventReserve", () => {
        const tx = mockContext.prisma as any as TransactionClient;

        beforeEach(() => {
            mockContext.prisma.$transaction.mockImplementation(async (callback) => callback(tx));
        });

        it("calls transaction wrapper with deleteEventReserveWithTx", async () => {
            await eventReserveActions.deleteEventReserve(userId, eventId);

            expect(mockContext.prisma.$transaction).toHaveBeenCalled();
            expect(tx.eventReserve.deleteMany).toHaveBeenCalled();
        });

        it("validates user ID before transaction", async () => {
            await expect(
                eventReserveActions.deleteEventReserve("invalid-id", eventId),
            ).rejects.toThrow();

            // Transaction should not be called if validation fails
            expect(mockContext.prisma.$transaction).not.toHaveBeenCalled();
        });

        it("validates event ID before transaction", async () => {
            await expect(
                eventReserveActions.deleteEventReserve(userId, "invalid-id"),
            ).rejects.toThrow();

            // Transaction should not be called if validation fails
            expect(mockContext.prisma.$transaction).not.toHaveBeenCalled();
        });

        it("handles deletion of non-existent reserve", async () => {
            tx.eventReserve.deleteMany.mockResolvedValue({ count: 0 } as any);

            await eventReserveActions.deleteEventReserve(userId, eventId);

            expect(tx.eventReserve.deleteMany).toHaveBeenCalled();
        });
    });
});
