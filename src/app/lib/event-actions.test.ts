import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { buildFormData } from "../../test/test-helpers";
import * as eventActions from "./event-actions";
import { informOfCancelledEvent, notifyEventReserves, sendMail } from "./mail-service/mail-service";
import { getLoggedInUser } from "./user-helpers";
import { getOrganizationSettings } from "./organization-settings-actions";
import { isUserAdmin, serverRedirect } from "./utils";
import dayjs from "dayjs";
import { prisma } from "../../prisma/prisma-client";
import { EventStatus, TaskStatus, TicketType } from "../../prisma/generated/enums";

vi.mock("./mail-service/mail-service", () => ({
    sendMail: vi.fn(),
    notifyEventReserves: vi.fn(),
    informOfCancelledEvent: vi.fn(),
}));

vi.mock("./user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

vi.mock("./organization-settings-actions", () => ({
    getOrganizationSettings: vi.fn(),
}));

vi.mock("./utils", () => ({
    isUserAdmin: vi.fn(),
    serverRedirect: vi.fn(),
    getAbsoluteUrl: vi.fn((paths: string[], params: Record<string, string>) => {
        const path = paths.join("/");
        const query = new URLSearchParams(params).toString();
        return `http://localhost:3000/${path}?${query}`;
    }),
}));

const userId = "550e8400-e29b-41d4-a716-446655440001";
const eventId = "550e8400-e29b-41d4-a716-446655440002";
const locationId = "550e8400-e29b-41d4-a716-446655440003";
const ticketId = "550e8400-e29b-41d4-a716-446655440004";
const taskId = "550e8400-e29b-41d4-a716-446655440005";

describe("event-actions", () => {
    beforeEach(() => {
        vi.mocked(getOrganizationSettings).mockResolvedValue({
            event_manager_email: null,
        } as any);
        vi.mocked(getLoggedInUser).mockResolvedValue({
            id: userId,
            role: "member",
        } as any);
    });

    describe("getEventParticipants", () => {
        it("retrieves all participants for an event", async () => {
            const mockParticipants = [
                {
                    id: "participant-1",
                    user: { id: userId, nickname: "TestUser" },
                },
                {
                    id: "participant-2",
                    user: { id: "user-2", nickname: "AnotherUser" },
                },
            ];
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue(mockParticipants as any);

            const result = await eventActions.getEventParticipants(eventId);

            expect(vi.mocked(prisma.eventParticipant.findMany)).toHaveBeenCalledWith({
                where: {
                    ticket: {
                        event_id: eventId,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            nickname: true,
                        },
                    },
                },
            });
            expect(result).toEqual(mockParticipants);
        });

        it("returns empty array when no participants exist", async () => {
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue([]);

            const result = await eventActions.getEventParticipants(eventId);

            expect(result).toEqual([]);
        });
    });

    describe("createEvent", () => {
        beforeEach(() => {
            vi.mocked(prisma.location.findUniqueOrThrow).mockResolvedValue({
                id: locationId,
                capacity: 50,
            } as any);
            vi.mocked(prisma.event.create).mockResolvedValue({
                id: eventId,
                tickets: [{ product_id: ticketId, type: TicketType.volunteer }],
            } as any);
        });

        it("creates event with ticket and adds host as participant", async () => {
            const formData = buildFormData({
                title: "Summer Festival",
                description: "A fun event",
                location_id: locationId,
                start_time: "15/06/2024 09:00",
                end_time: "15/06/2024 17:00",
                max_participants: "20",
                full_ticket_price: "50",
                status: EventStatus.draft,
            });

            await eventActions.createEvent(userId, formData);

            expect(vi.mocked(prisma.location.findUniqueOrThrow)).toHaveBeenCalledWith({
                where: { id: locationId },
            });
            expect(vi.mocked(prisma.event.create)).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: "Summer Festival",
                        host: { connect: { id: userId } },
                        location: { connect: { id: locationId } },
                        tickets: expect.objectContaining({
                            create: expect.objectContaining({
                                type: TicketType.volunteer,
                                product: expect.objectContaining({
                                    create: expect.objectContaining({
                                        stock: 19, // max_participants - 1 for host
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            );
            expect(vi.mocked(prisma.eventParticipant.create)).toHaveBeenCalledWith({
                data: {
                    user_id: userId,
                    ticket_id: ticketId,
                },
            });
            expect(vi.mocked(serverRedirect)).toHaveBeenCalledWith(
                [GlobalConstants.CALENDAR_POST],
                { [GlobalConstants.EVENT_ID]: eventId },
            );
        });

        it("throws error when location capacity is too small", async () => {
            vi.mocked(prisma.location.findUniqueOrThrow).mockResolvedValue({
                id: locationId,
                capacity: 10,
            } as any);

            const formData = buildFormData({
                title: "Big Event",
                location_id: locationId,
                max_participants: "20",
                start_time: "15/06/2024 09:00",
                end_time: "15/06/2024 17:00",
                full_ticket_price: "0",
                status: EventStatus.draft,
            });

            await expect(eventActions.createEvent(userId, formData)).rejects.toThrow(
                "The location can't handle that many participants",
            );
        });

        it("throws error when location_id is missing", async () => {
            const formData = buildFormData({
                title: "Event Without Location",
                max_participants: "10",
                start_time: "15/06/2024 09:00",
                end_time: "15/06/2024 17:00",
                full_ticket_price: "0",
                status: EventStatus.draft,
            });

            await expect(eventActions.createEvent(userId, formData)).rejects.toThrow(
                "Location ID is required",
            );
        });

        it("sanitizes rich text fields", async () => {
            const formData = buildFormData({
                title: "Event",
                description: "<script>alert('xss')</script><p>Safe content</p>",
                location_id: locationId,
                max_participants: "10",
                start_time: "15/06/2024 09:00",
                end_time: "15/06/2024 17:00",
                full_ticket_price: "0",
                status: EventStatus.draft,
            });

            await eventActions.createEvent(userId, formData);

            expect(vi.mocked(prisma.event.create)).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        description: expect.not.stringContaining("<script>"),
                    }),
                }),
            );
        });
    });

    describe("updateEvent", () => {
        const mockEvent = {
            id: eventId,
            host_id: userId,
            status: EventStatus.draft,
            max_participants: 20,
            host: {
                email: "host@example.com",
            },
            tickets: [
                {
                    product_id: ticketId,
                    product: { id: ticketId, stock: 19 },
                },
            ],
        };

        beforeEach(() => {
            vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue(mockEvent as any);
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue([
                { user_id: userId },
            ] as any);
        });

        it("updates event successfully", async () => {
            const formData = buildFormData({
                title: "Updated Event",
                max_participants: "20",
                status: EventStatus.draft,
            });

            await eventActions.updateEvent(eventId, formData);

            expect(vi.mocked(prisma.event.update)).toHaveBeenCalledWith({
                where: { id: eventId },
                data: expect.objectContaining({
                    title: "Updated Event",
                }),
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.EVENT, "max");
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TICKET, "max");
        });

        it("increases stock and notifies reserves when max_participants increases", async () => {
            const formData = buildFormData({
                title: "Event",
                max_participants: "25", // increased from 20
                status: EventStatus.draft,
            });

            await eventActions.updateEvent(eventId, formData);

            expect(vi.mocked(prisma.product.updateMany)).toHaveBeenCalledWith({
                where: { id: { in: [ticketId] } },
                data: {
                    stock: {
                        increment: 5,
                    },
                },
            });
            expect(vi.mocked(notifyEventReserves)).toHaveBeenCalledWith(eventId);
        });

        it("decreases stock when max_participants decreases", async () => {
            const formData = buildFormData({
                title: "Event",
                max_participants: "15", // decreased from 20
                status: EventStatus.draft,
            });

            await eventActions.updateEvent(eventId, formData);

            expect(vi.mocked(prisma.product.updateMany)).toHaveBeenCalledWith({
                where: { id: { in: [ticketId] } },
                data: {
                    stock: {
                        increment: -5,
                    },
                },
            });
            expect(vi.mocked(notifyEventReserves)).not.toHaveBeenCalled();
        });

        it("throws error when reducing max_participants below current participant count", async () => {
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue([
                { user_id: userId },
                { user_id: "user-2" },
                { user_id: "user-3" },
            ] as any);

            const formData = buildFormData({
                max_participants: "2", // less than 3 participants
                status: EventStatus.draft,
            });

            await expect(eventActions.updateEvent(eventId, formData)).rejects.toThrow(
                "The event has 3 participants",
            );
        });

        it("allows updating without specifying max_participants", async () => {
            const formData = buildFormData({
                title: "Updated Event Title",
                status: EventStatus.draft,
            });

            await eventActions.updateEvent(eventId, formData);

            expect(vi.mocked(prisma.event.update)).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: eventId },
                    data: expect.objectContaining({
                        title: "Updated Event Title",
                    }),
                }),
            );
        });

        it("notifies event manager when status changes to pending approval", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                event_manager_email: "manager@example.com",
            } as any);

            const formData = buildFormData({
                max_participants: "20",
                status: EventStatus.pending_approval,
            });

            await eventActions.updateEvent(eventId, formData);

            expect(vi.mocked(sendMail)).toHaveBeenCalledWith(
                ["manager@example.com"],
                "Event requires approval",
                expect.anything(),
                "host@example.com",
            );
        });

        it("notifies event host when status changes to published", async () => {
            const formData = buildFormData({
                max_participants: "20",
                status: EventStatus.published,
            });

            await eventActions.updateEvent(eventId, formData);

            expect(vi.mocked(sendMail)).toHaveBeenCalledWith(
                ["host@example.com"],
                "Event published",
                expect.anything(),
            );
        });

        it("throws error when non-admin tries to publish event with approval required", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                event_manager_email: "manager@example.com",
            } as any);
            vi.mocked(isUserAdmin).mockReturnValue(false);

            const formData = buildFormData({
                max_participants: "20",
                status: EventStatus.published,
            });

            await expect(eventActions.updateEvent(eventId, formData)).rejects.toThrow(
                "You are not authorized to publish this event",
            );
        });

        it("allows admin to publish event even with approval required", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                event_manager_email: "manager@example.com",
            } as any);
            vi.mocked(isUserAdmin).mockReturnValue(true);

            const formData = buildFormData({
                max_participants: "20",
                status: EventStatus.published,
            });

            await eventActions.updateEvent(eventId, formData);

            expect(vi.mocked(prisma.event.update)).toHaveBeenCalled();
        });

        it("handles failed notification to reserves gracefully", async () => {
            vi.mocked(notifyEventReserves).mockRejectedValue(new Error("Mail error"));

            const formData = buildFormData({
                max_participants: "25",
                status: EventStatus.draft,
            });

            await eventActions.updateEvent(eventId, formData);

            expect(vi.mocked(prisma.event.update)).toHaveBeenCalled();
        });

        it("throws error when event host is missing on pending approval notification", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                event_manager_email: "manager@example.com",
            } as any);
            vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue({
                ...mockEvent,
                host: null,
            } as any);

            const formData = buildFormData({
                max_participants: "20",
                status: EventStatus.pending_approval,
            });

            await expect(eventActions.updateEvent(eventId, formData)).rejects.toThrow(
                "Event host not found",
            );
        });

        it("throws error when event host is missing on published notification", async () => {
            vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue({
                ...mockEvent,
                host: null,
            } as any);

            const formData = buildFormData({
                max_participants: "20",
                status: EventStatus.published,
            });

            await expect(eventActions.updateEvent(eventId, formData)).rejects.toThrow(
                "Event host not found",
            );
        });
    });

    describe("publishEvent", () => {
        it("publishes event and revalidates cache", async () => {
            await eventActions.publishEvent(eventId);

            expect(vi.mocked(prisma.event.update)).toHaveBeenCalledWith({
                where: { id: eventId },
                data: { status: EventStatus.published },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.EVENT, "max");
        });

        it("throws error on invalid event ID format", async () => {
            await expect(eventActions.publishEvent("invalid-id")).rejects.toThrow();
        });
    });

    describe("cancelEvent", () => {
        it("cancels event and informs participants", async () => {
            vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue({
                id: eventId,
                status: EventStatus.published,
                max_participants: 20,
                host_id: userId,
                host: { email: "host@example.com" },
                tickets: [{ product: { id: ticketId } }],
            } as any);
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue([
                { user_id: userId },
            ] as any);
            vi.mocked(prisma.event.update).mockResolvedValue({} as any);

            await eventActions.cancelEvent(eventId);

            expect(vi.mocked(prisma.event.update)).toHaveBeenCalledWith({
                where: { id: eventId },
                data: expect.objectContaining({
                    status: EventStatus.cancelled,
                }),
            });
            expect(vi.mocked(informOfCancelledEvent)).toHaveBeenCalledWith(eventId);
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.EVENT, "max");
        });

        it("handles failed cancellation notification gracefully", async () => {
            vi.mocked(informOfCancelledEvent).mockRejectedValue(new Error("Mail error"));
            vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue({
                id: eventId,
                status: EventStatus.published,
                max_participants: 20,
                host_id: userId,
                host: { email: "host@example.com" },
                tickets: [{ product: { id: ticketId } }],
            } as any);
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue([
                { user_id: userId },
            ] as any);
            vi.mocked(prisma.event.update).mockResolvedValue({} as any);

            await eventActions.cancelEvent(eventId);

            expect(vi.mocked(prisma.event.update)).toHaveBeenCalled();
        });

        it("throws error on invalid event ID format", async () => {
            await expect(eventActions.cancelEvent("invalid-id")).rejects.toThrow();
        });
    });

    describe("deleteEvent", () => {
        it("deletes event with only host as participant", async () => {
            vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue({
                id: eventId,
                host_id: userId,
                tickets: [
                    {
                        event_participants: [{ user_id: userId }],
                    },
                ],
            } as any);
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue([
                { user_id: userId },
            ] as any);
            vi.mocked(prisma.eventReserve.deleteMany).mockResolvedValue({ count: 0 } as any);
            vi.mocked(prisma.eventParticipant.deleteMany).mockResolvedValue({ count: 1 } as any);
            vi.mocked(prisma.product.deleteMany).mockResolvedValue({ count: 1 } as any);
            vi.mocked(prisma.event.delete).mockResolvedValue({} as any);
            vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

            await eventActions.deleteEvent(eventId);

            expect(vi.mocked(prisma.eventReserve.deleteMany)).toHaveBeenCalledWith({
                where: { event_id: eventId },
            });
            expect(vi.mocked(prisma.eventParticipant.deleteMany)).toHaveBeenCalledWith({
                where: { ticket: { event_id: eventId } },
            });
            expect(vi.mocked(prisma.product.deleteMany)).toHaveBeenCalledWith({
                where: { ticket: { event_id: eventId } },
            });
            expect(vi.mocked(prisma.event.delete)).toHaveBeenCalledWith({
                where: { id: eventId },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.EVENT, "max");
            expect(vi.mocked(serverRedirect)).toHaveBeenCalledWith([GlobalConstants.CALENDAR]);
        });

        it("throws error when event has participants other than host", async () => {
            vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue({
                id: eventId,
                host_id: userId,
                tickets: [{ event_participants: [] }],
            } as any);
            vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue([
                { user_id: userId },
                { user_id: "other-user" },
            ] as any);

            await expect(eventActions.deleteEvent(eventId)).rejects.toThrow(
                "The event has participants and cannot be deleted",
            );
        });

        it("throws error on invalid event ID format", async () => {
            await expect(eventActions.deleteEvent("invalid-id")).rejects.toThrow();
        });
    });

    describe("cloneEvent", () => {
        const mockEvent = {
            id: eventId,
            title: "Original Event",
            description: "Event description",
            host_id: "original-host",
            location_id: locationId,
            start_time: new Date("2024-06-15T09:00:00Z"),
            end_time: new Date("2024-06-15T17:00:00Z"),
            max_participants: 20,
            full_ticket_price: 50,
            status: EventStatus.published,
        };

        const mockTickets = [
            {
                product_id: ticketId,
                event_id: eventId,
                type: TicketType.volunteer,
                product: {
                    id: ticketId,
                    name: "Volunteer ticket",
                    description: "Ticket description",
                    price: 0,
                    stock: 19,
                },
            },
        ];

        const mockTasks = [
            {
                id: taskId,
                name: "Setup",
                event_id: eventId,
                start_time: new Date("2024-06-15T08:00:00Z"),
                end_time: new Date("2024-06-15T09:00:00Z"),
                assignee_id: null,
                reviewer_id: "original-host",
                status: TaskStatus.toDo,
                skill_badges: [{ id: "badge-1", skill_badge_id: "skill-1", task_id: taskId }],
            },
        ];

        beforeEach(() => {
            vi.mocked(prisma.event.findUniqueOrThrow).mockResolvedValue(mockEvent as any);
            vi.mocked(prisma.ticket.findMany).mockResolvedValue(mockTickets as any);
            vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as any);
            vi.mocked(prisma.event.create).mockResolvedValue({
                ...mockEvent,
                id: "cloned-event-id",
                title: "Original Event (Clone)",
                status: EventStatus.draft,
            } as any);
            vi.mocked(prisma.ticket.create).mockResolvedValue({
                product_id: "cloned-ticket-id",
                type: TicketType.volunteer,
            } as any);
        });

        it("clones event with new start time and adds logged-in user as host", async () => {
            const formData = buildFormData({
                start_time: "15/07/2024 09:00",
            });

            await eventActions.cloneEvent(eventId, formData);

            expect(vi.mocked(prisma.event.create)).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: "Original Event (Clone)",
                    status: EventStatus.draft,
                    start_time: "2024-07-15T09:00:00Z",
                    host: { connect: { id: userId } },
                }),
            });
            expect(vi.mocked(serverRedirect)).toHaveBeenCalledWith(
                [GlobalConstants.CALENDAR_POST],
                expect.objectContaining({ [GlobalConstants.EVENT_ID]: expect.any(String) }),
            );
        });

        it("adjusts end time based on original duration", async () => {
            const originalDuration = dayjs
                .utc(mockEvent.end_time)
                .diff(dayjs.utc(mockEvent.start_time));
            const newStartTime = dayjs.utc("2024-07-15T09:00:00Z");
            const expectedEndTime = newStartTime.add(originalDuration).toISOString();

            const formData = buildFormData({
                start_time: "15/07/2024 09:00",
            });

            await eventActions.cloneEvent(eventId, formData);

            expect(vi.mocked(prisma.event.create)).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    end_time: expectedEndTime,
                }),
            });
        });

        it("clones tickets and adds host as participant", async () => {
            const formData = buildFormData({
                start_time: "20/08/2024 10:00",
            });

            await eventActions.cloneEvent(eventId, formData);

            expect(vi.mocked(prisma.ticket.create)).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    type: TicketType.volunteer,
                    product: {
                        create: expect.objectContaining({
                            stock: 19, // max_participants - 1
                        }),
                    },
                    event: { connect: { id: "cloned-event-id" } },
                }),
            });
            expect(vi.mocked(prisma.eventParticipant.create)).toHaveBeenCalledWith({
                data: {
                    user: { connect: { id: userId } },
                    ticket: { connect: { product_id: "cloned-ticket-id" } },
                },
            });
        });

        it("clones tasks with adjusted times and resets status", async () => {
            const formData = buildFormData({
                start_time: "20/08/2024 10:00",
            });

            await eventActions.cloneEvent(eventId, formData);

            expect(vi.mocked(prisma.task.create)).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: "Setup",
                    assignee_id: null,
                    reviewer_id: userId,
                    status: TaskStatus.toDo,
                    skill_badges: {
                        createMany: {
                            data: [
                                expect.objectContaining({
                                    skill_badge_id: "skill-1",
                                    id: undefined,
                                    task_id: undefined,
                                }),
                            ],
                        },
                    },
                }),
            });
        });

        it("throws error when user is not logged in", async () => {
            vi.mocked(getLoggedInUser).mockResolvedValue(null);

            const formData = buildFormData({
                start_time: "15/07/2024 09:00",
            });

            await expect(eventActions.cloneEvent(eventId, formData)).rejects.toThrow(
                "You must be logged in to clone an event",
            );
        });

        it("throws error when volunteer ticket not found in cloned event", async () => {
            vi.mocked(prisma.ticket.create).mockResolvedValue({
                product_id: "cloned-ticket-id",
                type: TicketType.standard, // Not volunteer
            } as any);

            const formData = buildFormData({
                start_time: "15/07/2024 09:00",
            });

            await expect(eventActions.cloneEvent(eventId, formData)).rejects.toThrow(
                "Volunteer ticket not found in cloned tickets",
            );
        });

        it("uses event start time for task without start_time", async () => {
            const taskWithoutStartTime = {
                ...mockTasks[0],
                start_time: null,
            };
            vi.mocked(prisma.task.findMany).mockResolvedValue([taskWithoutStartTime] as any);

            const formData = buildFormData({
                start_time: "15/07/2024 09:00",
            });

            await eventActions.cloneEvent(eventId, formData);

            expect(vi.mocked(prisma.task.create)).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    start_time: expect.any(Date), // Uses createdEvent.start_time when task.start_time is null
                }),
            });
        });
    });
});
