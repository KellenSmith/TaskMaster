import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { Prisma } from "@/prisma/generated/client";
import { mockContext } from "../../test/mocks/prismaMock";
import type { TransactionClient } from "../../test/types/test-types";
import * as eventParticipantActions from "./event-participant-actions";
import { notifyEventReserves } from "./mail-service/mail-service";
import { deleteEventReserveWithTx } from "./event-reserve-actions";
import { getUserLanguage } from "./user-actions";
import LanguageTranslations from "./LanguageTranslations";
import dayjs from "dayjs";
import { prismaErrorCodes } from "../../prisma/prisma-error-codes";

vi.mock("./mail-service/mail-service", () => ({
    notifyEventReserves: vi.fn(),
}));

vi.mock("./event-reserve-actions", () => ({
    deleteEventReserveWithTx: vi.fn(),
}));

vi.mock("./user-actions", () => ({
    getUserLanguage: vi.fn(),
}));

const userId = "550e8400-e29b-41d4-a716-446655440001";
const ticketId = "550e8400-e29b-41d4-a716-446655440002";
const eventId = "550e8400-e29b-41d4-a716-446655440003";
const eventParticipantId = "550e8400-e29b-41d4-a716-446655440004";
const otherUserId = "550e8400-e29b-41d4-a716-446655440005";

describe("event-participant-actions", () => {
    beforeEach(() => {
        vi.mocked(getUserLanguage).mockResolvedValue("english");
    });

    describe("addEventParticipantWithTx", () => {
        const tx = mockContext.prisma as any as TransactionClient;

        const mockTicket = {
            product_id: ticketId,
            event_id: eventId,
        };

        const mockEvent = {
            id: eventId,
            max_participants: 10,
            tickets: [
                {
                    product_id: ticketId,
                    event_participants: [
                        { user_id: otherUserId },
                    ],
                },
            ],
        };

        beforeEach(() => {
            // Note: BUG - the implementation uses prisma instead of tx for these calls
            mockContext.prisma.ticket.findUniqueOrThrow.mockResolvedValue(mockTicket as any);
            mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue(mockEvent as any);
            vi.mocked(deleteEventReserveWithTx).mockResolvedValue();
        });

        it("adds event participant successfully", async () => {
            await eventParticipantActions.addEventParticipantWithTx(tx as any, ticketId, userId);

            expect(mockContext.prisma.ticket.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { product_id: ticketId },
            });
            expect(mockContext.prisma.event.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: eventId },
                include: {
                    tickets: {
                        include: {
                            event_participants: true,
                        },
                    },
                },
            });
            expect(vi.mocked(deleteEventReserveWithTx)).toHaveBeenCalledWith(
                tx,
                userId,
                eventId,
            );
            expect(tx.product.updateMany).toHaveBeenCalledWith({
                where: {
                    ticket: { event_id: eventId },
                    NOT: { stock: null },
                },
                data: {
                    stock: { decrement: 1 },
                },
            });
            expect(tx.eventParticipant.create).toHaveBeenCalledWith({
                data: {
                    user: { connect: { id: userId } },
                    ticket: { connect: { product_id: ticketId } },
                },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.RESERVE_USERS,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.TICKET,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.PARTICIPANT_USERS,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.EVENT,
                "max",
            );
        });

        it("throws error when user is already a participant", async () => {
            const eventWithExistingParticipant = {
                ...mockEvent,
                tickets: [
                    {
                        product_id: ticketId,
                        event_participants: [
                            { user_id: userId },
                            { user_id: otherUserId },
                        ],
                    },
                ],
            };
            mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue(
                eventWithExistingParticipant as any,
            );

            await expect(
                eventParticipantActions.addEventParticipantWithTx(tx as any, ticketId, userId),
            ).rejects.toThrow("Member is already a participant");
        });

        it("throws error when event is sold out", async () => {
            const soldOutEvent = {
                ...mockEvent,
                max_participants: 2,
                tickets: [
                    {
                        product_id: ticketId,
                        event_participants: [
                            { user_id: otherUserId },
                            { user_id: "another-user-id" },
                        ],
                    },
                ],
            };
            mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue(soldOutEvent as any);

            await expect(
                eventParticipantActions.addEventParticipantWithTx(tx as any, ticketId, userId),
            ).rejects.toThrow("Event is already sold out");
        });

        it("handles event with no existing participants", async () => {
            const emptyEvent = {
                ...mockEvent,
                tickets: [
                    {
                        product_id: ticketId,
                        event_participants: [],
                    },
                ],
            };
            mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue(emptyEvent as any);

            await eventParticipantActions.addEventParticipantWithTx(tx as any, ticketId, userId);

            expect(tx.eventParticipant.create).toHaveBeenCalled();
        });

        it("handles event with unlimited participants", async () => {
            const unlimitedEvent = {
                ...mockEvent,
                max_participants: 1000,
            };
            mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue(unlimitedEvent as any);

            await eventParticipantActions.addEventParticipantWithTx(tx as any, ticketId, userId);

            expect(tx.eventParticipant.create).toHaveBeenCalled();
        });

        it("does not decrement stock for tickets with null stock", async () => {
            await eventParticipantActions.addEventParticipantWithTx(tx as any, ticketId, userId);

            expect(tx.product.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        NOT: { stock: null },
                    }),
                }),
            );
        });
    });

    describe("addEventParticipant", () => {
        it("calls transaction wrapper with addEventParticipantWithTx", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            mockContext.prisma.$transaction.mockImplementation(async (callback) => callback(tx));

            const mockTicket = {
                product_id: ticketId,
                event_id: eventId,
            };
            const mockEvent = {
                id: eventId,
                max_participants: 10,
                tickets: [{ product_id: ticketId, event_participants: [] }],
            };
            mockContext.prisma.ticket.findUniqueOrThrow.mockResolvedValue(mockTicket as any);
            mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue(mockEvent as any);
            vi.mocked(deleteEventReserveWithTx).mockResolvedValue();

            await eventParticipantActions.addEventParticipant(userId, ticketId);

            expect(mockContext.prisma.$transaction).toHaveBeenCalled();
            expect(tx.eventParticipant.create).toHaveBeenCalled();
        });
    });

    describe("deleteEventParticipantWithTx", () => {
        const tx = mockContext.prisma as any as TransactionClient;

        const mockTicket = {
            product_id: ticketId,
            event_id: eventId,
        };

        beforeEach(() => {
            tx.ticket.findFirstOrThrow.mockResolvedValue(mockTicket as any);
            vi.mocked(notifyEventReserves).mockResolvedValue();
        });

        it("deletes event participant and notifies reserves", async () => {
            await eventParticipantActions.deleteEventParticipantWithTx(tx as any, eventId, userId);

            expect(tx.ticket.findFirstOrThrow).toHaveBeenCalledWith({
                where: {
                    event_id: eventId,
                    event_participants: {
                        some: { user_id: userId },
                    },
                },
            });
            expect(tx.eventParticipant.deleteMany).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    ticket_id: ticketId,
                },
            });
            expect(tx.product.updateMany).toHaveBeenCalledWith({
                where: {
                    ticket: { event_id: eventId },
                    NOT: { stock: null },
                },
                data: {
                    stock: { increment: 1 },
                },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.PARTICIPANT_USERS,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.EVENT,
                "max",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.TICKET,
                "max",
            );
            expect(vi.mocked(notifyEventReserves)).toHaveBeenCalledWith(eventId);
        });

        it("throws error when ticket not found", async () => {
            tx.ticket.findFirstOrThrow.mockRejectedValue(new Error("Ticket not found"));

            await expect(
                eventParticipantActions.deleteEventParticipantWithTx(tx as any, eventId, userId),
            ).rejects.toThrow("Ticket not found");
        });

        it("increments stock only for tickets with limited stock", async () => {
            await eventParticipantActions.deleteEventParticipantWithTx(tx as any, eventId, userId);

            expect(tx.product.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        NOT: { stock: null },
                    }),
                }),
            );
        });
    });

    describe("deleteEventParticipant", () => {
        const tx = mockContext.prisma as any as TransactionClient;

        beforeEach(() => {
            mockContext.prisma.$transaction.mockImplementation(async (callback) => callback(tx));
            tx.ticket.findFirstOrThrow.mockResolvedValue({
                product_id: ticketId,
                event_id: eventId,
            } as any);
            tx.event.findUniqueOrThrow.mockResolvedValue({
                id: eventId,
                start_time: dayjs().add(1, "day").toDate(),
                end_time: dayjs().add(1, "day").add(2, "hours").toDate(),
            } as any);
            vi.mocked(notifyEventReserves).mockResolvedValue();
        });

        it("deletes participant and unassigns from event tasks", async () => {
            await eventParticipantActions.deleteEventParticipant(eventId, userId);

            expect(mockContext.prisma.$transaction).toHaveBeenCalled();
            expect(tx.eventParticipant.deleteMany).toHaveBeenCalled();
            expect(tx.event.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: eventId },
            });
            expect(tx.task.updateMany).toHaveBeenCalled();
        });
    });

    describe("unassignUserFromEventTasks", () => {
        const tx = mockContext.prisma as any as TransactionClient;

        const mockEvent = {
            id: eventId,
            start_time: dayjs("2024-06-15T09:00:00Z").toDate(),
            end_time: dayjs("2024-06-15T17:00:00Z").toDate(),
        };

        beforeEach(() => {
            tx.event.findUniqueOrThrow.mockResolvedValue(mockEvent as any);
        });

        it("unassigns tasks that start within event time", async () => {
            await eventParticipantActions.unassignUserFromEventTasks(tx as any, eventId, userId);

            expect(tx.event.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: eventId },
            });
            expect(tx.task.updateMany).toHaveBeenCalledWith({
                where: {
                    AND: [
                        {
                            OR: [
                                {
                                    start_time: {
                                        gte: mockEvent.start_time,
                                        lte: mockEvent.end_time,
                                    },
                                },
                                {
                                    end_time: {
                                        gte: mockEvent.start_time,
                                        lte: mockEvent.end_time,
                                    },
                                },
                            ],
                        },
                    ],
                    event_id: eventId,
                    assignee_id: userId,
                },
                data: {
                    assignee_id: null,
                },
            });
        });

        it("throws error when event not found", async () => {
            tx.event.findUniqueOrThrow.mockRejectedValue(new Error("Event not found"));

            await expect(
                eventParticipantActions.unassignUserFromEventTasks(tx as any, eventId, userId),
            ).rejects.toThrow("Event not found");
        });

        it("handles event with no tasks", async () => {
            tx.task.updateMany.mockResolvedValue({ count: 0 } as any);

            await eventParticipantActions.unassignUserFromEventTasks(tx as any, eventId, userId);

            expect(tx.task.updateMany).toHaveBeenCalled();
        });
    });

    describe("checkInEventParticipant", () => {
        const now = dayjs.utc();
        const eventStartTime = now.subtract(30, "minutes").toDate();
        const eventEndTime = now.add(1, "hour").toDate();

        const mockEventParticipant = {
            id: eventParticipantId,
            checked_in_at: null,
            ticket: {
                event: {
                    id: eventId,
                    start_time: eventStartTime,
                    end_time: eventEndTime,
                },
            },
        };

        beforeEach(() => {
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockResolvedValue(
                mockEventParticipant as any,
            );
        });

        it("checks in participant successfully during valid time window", async () => {
            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(mockContext.prisma.eventParticipant.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: eventParticipantId },
                include: {
                    ticket: {
                        include: {
                            event: true,
                        },
                    },
                },
            });
            expect(mockContext.prisma.eventParticipant.update).toHaveBeenCalledWith({
                where: { id: eventParticipantId },
                data: { checked_in_at: expect.any(Date) },
            });
            expect(result).toBeUndefined();
        });

        it("returns message when already checked in", async () => {
            const checkedInAt = now.subtract(1, "hour").toDate();
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockResolvedValue({
                ...mockEventParticipant,
                checked_in_at: checkedInAt,
            } as any);

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(result).toContain(LanguageTranslations.alreadyCheckedIn.english);
            expect(mockContext.prisma.eventParticipant.update).not.toHaveBeenCalled();
        });

        it("allows check-in when checked_in_at is within 10 seconds (concurrent check-in)", async () => {
            const recentCheckIn = now.subtract(5, "seconds").toDate();
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockResolvedValue({
                ...mockEventParticipant,
                checked_in_at: recentCheckIn,
            } as any);

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(result).toBeUndefined();
            expect(mockContext.prisma.eventParticipant.update).not.toHaveBeenCalled();
        });

        it("does not check in before event window (more than 1 hour before start)", async () => {
            const futureEvent = {
                ...mockEventParticipant,
                ticket: {
                    event: {
                        id: eventId,
                        start_time: now.add(2, "hours").toDate(),
                        end_time: now.add(4, "hours").toDate(),
                    },
                },
            };
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockResolvedValue(
                futureEvent as any,
            );

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(result).toBeUndefined();
            expect(mockContext.prisma.eventParticipant.update).not.toHaveBeenCalled();
        });

        it("does not check in after event window (more than 1 hour after end)", async () => {
            const pastEvent = {
                ...mockEventParticipant,
                ticket: {
                    event: {
                        id: eventId,
                        start_time: now.subtract(4, "hours").toDate(),
                        end_time: now.subtract(2, "hours").toDate(),
                    },
                },
            };
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockResolvedValue(
                pastEvent as any,
            );

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(result).toBeUndefined();
            expect(mockContext.prisma.eventParticipant.update).not.toHaveBeenCalled();
        });

        it("allows check-in exactly 1 hour before event start", async () => {
            const eventInOneHour = {
                ...mockEventParticipant,
                ticket: {
                    event: {
                        id: eventId,
                        start_time: now.add(1, "hour").toDate(),
                        end_time: now.add(3, "hours").toDate(),
                    },
                },
            };
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockResolvedValue(
                eventInOneHour as any,
            );

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(mockContext.prisma.eventParticipant.update).toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        it("does not check in exactly 1 hour after event end (boundary not inclusive)", async () => {
            const eventEndedOneHourAgo = {
                ...mockEventParticipant,
                ticket: {
                    event: {
                        id: eventId,
                        start_time: now.subtract(3, "hours").toDate(),
                        end_time: now.subtract(1, "hour").toDate(),
                    },
                },
            };
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockResolvedValue(
                eventEndedOneHourAgo as any,
            );

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(mockContext.prisma.eventParticipant.update).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        it("returns error message when participant not found", async () => {
            const error = new Prisma.PrismaClientKnownRequestError(
                "Record not found",
                {
                    code: prismaErrorCodes.resultNotFound,
                    clientVersion: "5.0.0",
                },
            );
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockRejectedValue(error);

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(result).toBe(LanguageTranslations.eventParticipantNotFound.english);
        });

        it("throws error on invalid event participant ID format", async () => {
            await expect(
                eventParticipantActions.checkInEventParticipant("invalid-id"),
            ).rejects.toThrow();
        });

        it("handles unknown errors gracefully", async () => {
            const unknownError = new Error("Unknown database error");
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockRejectedValue(
                unknownError,
            );

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(result).toBeUndefined();
        });

        it("uses correct user language for error messages", async () => {
            vi.mocked(getUserLanguage).mockResolvedValue("swedish");
            const error = new Prisma.PrismaClientKnownRequestError(
                "Record not found",
                {
                    code: prismaErrorCodes.resultNotFound,
                    clientVersion: "5.0.0",
                },
            );
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockRejectedValue(error);

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(result).toBe(LanguageTranslations.eventParticipantNotFound.swedish);
        });

        it("checks in participant during event", async () => {
            const duringEvent = {
                ...mockEventParticipant,
                ticket: {
                    event: {
                        id: eventId,
                        start_time: now.subtract(30, "minutes").toDate(),
                        end_time: now.add(30, "minutes").toDate(),
                    },
                },
            };
            mockContext.prisma.eventParticipant.findUniqueOrThrow.mockResolvedValue(
                duringEvent as any,
            );

            const result = await eventParticipantActions.checkInEventParticipant(
                eventParticipantId,
            );

            expect(mockContext.prisma.eventParticipant.update).toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });
});
