import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import type { TransactionClient } from "../../test/types/test-types";
import { buildFormData } from "../../test/test-helpers";
import * as taskActions from "./task-actions";
import { sendMail } from "./mail-service/mail-service";
import {
    addEventParticipantWithTx,
    deleteEventParticipantWithTx,
} from "./event-participant-actions";
import { addEventReserveWithTx } from "./event-reserve-actions";
import { getLoggedInUser } from "./user-helpers";
import { isUserAdmin, isUserHost } from "./utils";
import { TaskStatus, TicketType, UserRole } from "../../prisma/generated/enums";

vi.mock("./mail-service/mail-service", () => ({
    sendMail: vi.fn(),
}));

vi.mock("./event-participant-actions", () => ({
    addEventParticipantWithTx: vi.fn(),
    deleteEventParticipantWithTx: vi.fn(),
}));

vi.mock("./event-reserve-actions", () => ({
    addEventReserveWithTx: vi.fn(),
}));

vi.mock("./user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

vi.mock("./utils", () => ({
    isUserAdmin: vi.fn(),
    isUserHost: vi.fn(),
    serverRedirect: vi.fn(),
}));

const taskId = "550e8400-e29b-41d4-a716-446655440000";
const userId = "550e8400-e29b-41d4-a716-446655440001";
const eventId = "550e8400-e29b-41d4-a716-446655440002";
const reviewerId = "550e8400-e29b-41d4-a716-446655440003";
const productId = "550e8400-e29b-41d4-a716-446655440004";
const badgeId1 = "550e8400-e29b-41d4-a716-446655440005";
const badgeId2 = "550e8400-e29b-41d4-a716-446655440006";

describe("task-actions", () => {
    describe("deleteTask", () => {
        it("deletes task and revalidates cache", async () => {
            mockContext.prisma.task.delete.mockResolvedValue({} as any);

            await taskActions.deleteTask(taskId);

            expect(mockContext.prisma.task.delete).toHaveBeenCalledWith({
                where: { id: taskId },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TASK, "max");
        });

        it("throws error on invalid UUID", async () => {
            await expect(taskActions.deleteTask("invalid-uuid")).rejects.toThrow();
        });

        it("throws error when task not found", async () => {
            mockContext.prisma.task.delete.mockRejectedValue(new Error("Task not found"));

            await expect(taskActions.deleteTask(taskId)).rejects.toThrow();
        });
    });

    describe("updateTaskById", () => {
        const oldTask = {
            id: taskId,
            name: "Old Task Name",
            status: TaskStatus.inProgress,
            assignee_id: userId,
            reviewer_id: reviewerId,
        };

        const updatedTask = {
            id: taskId,
            name: "Updated Task Name",
            status: TaskStatus.inReview,
            assignee_id: userId,
            reviewer_id: reviewerId,
            reviewer: {
                id: reviewerId,
                email: "reviewer@example.com",
            },
        };

        beforeEach(() => {
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(oldTask as any);
        });

        it("updates task with basic fields", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(updatedTask as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                name: "Updated Task Name",
                description: "Updated description",
                end_time: "15/06/2024 17:00",
                status: TaskStatus.inReview,
            });

            await taskActions.updateTaskById(taskId, formData);

            expect(mockContext.prisma.task.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: taskId },
            });
            expect(tx.task.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: taskId },
                    include: { reviewer: true },
                }),
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TASK, "max");
        });

        it("updates assignee and reviewer", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(updatedTask as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                name: "Task",
                description: "Desc",
                end_time: "15/06/2024 17:00",
                assignee_id: userId,
                reviewer_id: reviewerId,
            });

            await taskActions.updateTaskById(taskId, formData);

            expect(tx.task.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        assignee_id: userId,
                        reviewer_id: reviewerId,
                    }),
                }),
            );
        });

        it("updates skill badges by deleting old and creating new", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(updatedTask as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                name: "Task",
                description: "Desc",
                end_time: "15/06/2024 17:00",
                skill_badges: `${badgeId1},${badgeId2}`,
            });

            await taskActions.updateTaskById(taskId, formData);

            expect(mockContext.prisma.taskSkillBadge.deleteMany).toHaveBeenCalledWith({
                where: { task_id: taskId },
            });
            expect(mockContext.prisma.taskSkillBadge.createMany).toHaveBeenCalledWith({
                data: [
                    { task_id: taskId, skill_badge_id: badgeId1 },
                    { task_id: taskId, skill_badge_id: badgeId2 },
                ],
            });
        });

        it("sends email to reviewer when task moves to inReview status", async () => {
            const oldTaskToDo = { ...oldTask, status: TaskStatus.toDo };
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(oldTaskToDo as any);

            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(updatedTask as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                name: "Updated Task Name",
                description: "Updated description",
                end_time: "15/06/2024 17:00",
                status: TaskStatus.inReview,
            });

            await taskActions.updateTaskById(taskId, formData);

            expect(vi.mocked(sendMail)).toHaveBeenCalledWith(
                ["reviewer@example.com"],
                "Task updated",
                expect.anything(),
            );
        });

        it("sends email to reviewer when assignee removed and status is not toDo", async () => {
            const oldTaskWithAssignee = { ...oldTask, assignee_id: userId };
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(oldTaskWithAssignee as any);

            const updatedTaskNoAssignee = { ...updatedTask, assignee_id: null };
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(updatedTaskNoAssignee as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                name: "Updated Task Name",
                description: "Updated description",
                end_time: "15/06/2024 17:00",
                status: TaskStatus.inProgress,
            });

            await taskActions.updateTaskById(taskId, formData);

            expect(vi.mocked(sendMail)).toHaveBeenCalledWith(
                ["reviewer@example.com"],
                "Task updated",
                expect.anything(),
            );
        });

        it("does not send email to reviewer when assignee removed but status is toDo", async () => {
            const oldTaskWithAssignee = { ...oldTask, assignee_id: userId };
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(oldTaskWithAssignee as any);

            const updatedTaskNoAssignee = {
                ...updatedTask,
                assignee_id: null,
                status: TaskStatus.toDo,
            };
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(updatedTaskNoAssignee as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                name: "Updated Task Name",
                description: "Updated description",
                end_time: "15/06/2024 17:00",
                status: TaskStatus.toDo,
            });

            await taskActions.updateTaskById(taskId, formData);

            expect(vi.mocked(sendMail)).not.toHaveBeenCalled();
        });

        it("does not send email when no reviewer", async () => {
            const updatedTaskNoReviewer = { ...updatedTask, reviewer: null };
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(updatedTaskNoReviewer as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            const formData = buildFormData({
                name: "Updated Task Name",
                description: "Updated description",
                end_time: "15/06/2024 17:00",
                status: TaskStatus.inReview,
            });

            await taskActions.updateTaskById(taskId, formData);

            expect(vi.mocked(sendMail)).not.toHaveBeenCalled();
        });

        it("throws error on invalid UUID", async () => {
            const formData = buildFormData({
                name: "Task",
                description: "Desc",
                end_time: "15/06/2024 17:00",
            });

            await expect(taskActions.updateTaskById("invalid-uuid", formData)).rejects.toThrow();
        });

        it("throws error on invalid form data", async () => {
            const formData = buildFormData({
                end_time: "invalid-date",
            });

            await expect(taskActions.updateTaskById(taskId, formData)).rejects.toThrow();
        });
    });

    describe("createTask", () => {
        it("creates task with basic fields", async () => {
            mockContext.prisma.task.create.mockResolvedValue({ id: taskId } as any);

            const formData = buildFormData({
                name: "New Task",
                description: "Task description",
                end_time: "15/06/2024 17:00",
                assignee_id: "null",
                reviewer_id: reviewerId,
            });

            await taskActions.createTask(formData);

            expect(mockContext.prisma.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: "New Task",
                        description: "Task description",
                    }),
                    include: { reviewer: true },
                }),
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TASK, "max");
        });

        it("creates task with assignee and reviewer", async () => {
            mockContext.prisma.task.create.mockResolvedValue({ id: taskId } as any);

            const formData = buildFormData({
                name: "New Task",
                description: "Task description",
                end_time: "15/06/2024 17:00",
                assignee_id: userId,
                reviewer_id: reviewerId,
            });

            await taskActions.createTask(formData);

            expect(mockContext.prisma.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        assignee: { connect: { id: userId } },
                        reviewer: { connect: { id: reviewerId } },
                    }),
                }),
            );
        });

        it("creates task with event", async () => {
            mockContext.prisma.task.create.mockResolvedValue({ id: taskId } as any);

            const formData = buildFormData({
                name: "New Task",
                description: "Task description",
                end_time: "15/06/2024 17:00",
                assignee_id: "null",
                reviewer_id: reviewerId,
                event_id: eventId,
            });

            await taskActions.createTask(formData);

            expect(mockContext.prisma.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        event: { connect: { id: eventId } },
                    }),
                }),
            );
        });

        it("creates task with skill badges", async () => {
            mockContext.prisma.task.create.mockResolvedValue({ id: taskId } as any);

            const formData = buildFormData({
                name: "New Task",
                description: "Task description",
                end_time: "15/06/2024 17:00",
                assignee_id: "null",
                reviewer_id: reviewerId,
                skill_badges: `${badgeId1},${badgeId2}`,
            });

            await taskActions.createTask(formData);

            expect(mockContext.prisma.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        skill_badges: {
                            createMany: {
                                data: [{ skill_badge_id: badgeId1 }, { skill_badge_id: badgeId2 }],
                            },
                        },
                    }),
                }),
            );
        });

        it("creates task with tags", async () => {
            mockContext.prisma.task.create.mockResolvedValue({ id: taskId } as any);

            const formData = buildFormData({
                name: "New Task",
                description: "Task description",
                end_time: "15/06/2024 17:00",
                assignee_id: "null",
                reviewer_id: reviewerId,
                tags: "urgent,important",
            });

            await taskActions.createTask(formData);

            expect(mockContext.prisma.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        tags: ["urgent", "important"],
                    }),
                }),
            );
        });

        it("sanitizes rich text fields", async () => {
            mockContext.prisma.task.create.mockResolvedValue({ id: taskId } as any);

            const formData = buildFormData({
                name: "New Task",
                description: "<script>alert('xss')</script><p>Safe content</p>",
                end_time: "15/06/2024 17:00",
                assignee_id: "null",
                reviewer_id: reviewerId,
            });

            await taskActions.createTask(formData);

            // The sanitization should remove the script tag
            expect(mockContext.prisma.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        description: expect.not.stringContaining("<script>"),
                    }),
                }),
            );
        });

        it("throws error on invalid form data", async () => {
            const formData = buildFormData({});

            await expect(taskActions.createTask(formData)).rejects.toThrow();
        });
    });

    describe("assignTaskToUser", () => {
        const loggedInUser = {
            id: userId,
            role: UserRole.member,
        };

        const existingTask = {
            id: taskId,
            name: "Test Task",
            assignee_id: null,
            event_id: eventId,
            event: {
                id: eventId,
                host_id: "host-id",
            },
        };

        const volunteerTicket = {
            id: "ticket-id",
            product_id: productId,
            event_id: eventId,
            type: TicketType.volunteer,
        };

        beforeEach(() => {
            vi.mocked(getLoggedInUser).mockResolvedValue(loggedInUser as any);
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(existingTask as any);
        });

        it("assigns task to user and adds volunteer ticket", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: eventId } as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(null);
            vi.mocked(tx.ticket.findFirst).mockResolvedValue(volunteerTicket as any);
            vi.mocked(addEventParticipantWithTx).mockResolvedValue(undefined);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.assignTaskToUser(userId, taskId);

            expect(tx.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: {
                    assignee: { connect: { id: userId } },
                },
            });
            expect(vi.mocked(addEventParticipantWithTx)).toHaveBeenCalledWith(
                tx,
                productId,
                userId,
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TASK, "max");
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.EVENT, "max");
        });

        it("does not add volunteer ticket if user already has non-volunteer ticket", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const existingParticipant = { user_id: userId, event_id: eventId };
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: eventId } as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(existingParticipant as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.assignTaskToUser(userId, taskId);

            expect(vi.mocked(addEventParticipantWithTx)).not.toHaveBeenCalled();
        });

        it("adds to reserve list if event is sold out", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: eventId } as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(null);
            vi.mocked(tx.ticket.findFirst).mockResolvedValue(volunteerTicket as any);
            vi.mocked(addEventParticipantWithTx).mockRejectedValue(new Error("Event sold out"));
            vi.mocked(addEventReserveWithTx).mockResolvedValue(undefined);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.assignTaskToUser(userId, taskId);

            expect(vi.mocked(addEventReserveWithTx)).toHaveBeenCalledWith(tx, userId, eventId);
        });

        it("continues even if adding to reserve list fails", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: eventId } as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(null);
            vi.mocked(tx.ticket.findFirst).mockResolvedValue(volunteerTicket as any);
            vi.mocked(addEventParticipantWithTx).mockRejectedValue(new Error("Event sold out"));
            vi.mocked(addEventReserveWithTx).mockRejectedValue(
                new Error("Already on reserve list"),
            );
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await expect(taskActions.assignTaskToUser(userId, taskId)).resolves.not.toThrow();
        });

        it("allows member to self-assign unassigned task", async () => {
            const taskWithNoAssignee = { ...existingTask, assignee_id: null };
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(taskWithNoAssignee as any);

            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: null } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.assignTaskToUser(userId, taskId);

            expect(tx.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: {
                    assignee: { connect: { id: userId } },
                },
            });
        });

        it("allows admin to reassign task to different user", async () => {
            const taskAssignedToOther = { ...existingTask, assignee_id: "other-user-id" };
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(taskAssignedToOther as any);
            vi.mocked(isUserAdmin).mockReturnValue(true);

            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: null } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.assignTaskToUser(userId, taskId);

            expect(tx.task.update).toHaveBeenCalled();
        });

        it("allows event host to reassign task to different user", async () => {
            const taskAssignedToOther = { ...existingTask, assignee_id: "other-user-id" };
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(taskAssignedToOther as any);
            vi.mocked(isUserAdmin).mockReturnValue(false);
            vi.mocked(isUserHost).mockReturnValue(true);

            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: null } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.assignTaskToUser(userId, taskId);

            expect(tx.task.update).toHaveBeenCalled();
        });

        it("throws error when non-admin/non-host tries to reassign task", async () => {
            const taskAssignedToOther = { ...existingTask, assignee_id: "other-user-id" };
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(taskAssignedToOther as any);
            vi.mocked(isUserAdmin).mockReturnValue(false);
            vi.mocked(isUserHost).mockReturnValue(false);

            await expect(taskActions.assignTaskToUser(userId, taskId)).rejects.toThrow(
                "Only admins or event hosts can reassign tasks that are already assigned to someone else",
            );
        });

        it("throws error when non-admin tries to reassign task with no event", async () => {
            const taskAssignedToOtherNoEvent = {
                ...existingTask,
                assignee_id: "other-user-id",
                event_id: null,
                event: null,
            };
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(
                taskAssignedToOtherNoEvent as any,
            );
            vi.mocked(isUserAdmin).mockReturnValue(false);

            await expect(taskActions.assignTaskToUser(userId, taskId)).rejects.toThrow(
                "Only admins or event hosts can reassign tasks that are already assigned to someone else",
            );
        });

        it("throws error when user not logged in", async () => {
            vi.mocked(getLoggedInUser).mockResolvedValue(null);

            await expect(taskActions.assignTaskToUser(userId, taskId)).rejects.toThrow(
                "User must be logged in to assign tasks",
            );
        });

        it("throws error when volunteer ticket not found", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: eventId } as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(null);
            vi.mocked(tx.ticket.findFirst).mockResolvedValue(null);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await expect(taskActions.assignTaskToUser(userId, taskId)).rejects.toThrow(
                "Volunteer ticket not found",
            );
        });

        it("throws error on invalid user UUID", async () => {
            await expect(taskActions.assignTaskToUser("invalid-uuid", taskId)).rejects.toThrow();
        });

        it("throws error on invalid task UUID", async () => {
            await expect(taskActions.assignTaskToUser(userId, "invalid-uuid")).rejects.toThrow();
        });

        it("does not process event ticket logic when task has no event", async () => {
            const taskNoEvent = { ...existingTask, event_id: null, event: null };
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(taskNoEvent as any);

            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: null } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.assignTaskToUser(userId, taskId);

            expect(vi.mocked(addEventParticipantWithTx)).not.toHaveBeenCalled();
            expect(tx.eventParticipant.findFirst).not.toHaveBeenCalled();
        });
    });

    describe("unassignTaskFromUser", () => {
        const taskWithEvent = {
            id: taskId,
            name: "Test Task",
            event_id: eventId,
            reviewer_id: reviewerId,
            reviewer: {
                id: reviewerId,
                email: "reviewer@example.com",
            },
        };

        const event = {
            id: eventId,
            host_id: "host-user-id",
        };

        const volunteerParticipant = {
            user_id: userId,
            ticket: {
                event_id: eventId,
                type: TicketType.volunteer,
            },
        };

        it("unassigns task and revalidates cache", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: null } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.unassignTaskFromUser(userId, taskId);

            expect(tx.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: {
                    assignee: { disconnect: { id: userId } },
                },
                include: { reviewer: true },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TASK, "max");
        });

        it("removes volunteer ticket when user has no other tasks in event", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(taskWithEvent as any);
            vi.mocked(tx.event.findUniqueOrThrow).mockResolvedValue(event as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(volunteerParticipant as any);
            vi.mocked(tx.task.count).mockResolvedValue(0);
            vi.mocked(deleteEventParticipantWithTx).mockResolvedValue(undefined);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.unassignTaskFromUser(userId, taskId);

            expect(vi.mocked(deleteEventParticipantWithTx)).toHaveBeenCalledWith(
                tx,
                eventId,
                userId,
            );
        });

        it("keeps volunteer ticket when user has other tasks in event", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(taskWithEvent as any);
            vi.mocked(tx.event.findUniqueOrThrow).mockResolvedValue(event as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(volunteerParticipant as any);
            vi.mocked(tx.task.count).mockResolvedValue(2); // User still has 2 other tasks
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.unassignTaskFromUser(userId, taskId);

            expect(vi.mocked(deleteEventParticipantWithTx)).not.toHaveBeenCalled();
        });

        it("keeps volunteer ticket when user is event host", async () => {
            const eventWithUserAsHost = { ...event, host_id: userId };
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(taskWithEvent as any);
            vi.mocked(tx.event.findUniqueOrThrow).mockResolvedValue(eventWithUserAsHost as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.unassignTaskFromUser(userId, taskId);

            expect(tx.eventParticipant.findFirst).not.toHaveBeenCalled();
            expect(vi.mocked(deleteEventParticipantWithTx)).not.toHaveBeenCalled();
        });

        it("does not remove ticket if user does not have volunteer ticket", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(taskWithEvent as any);
            vi.mocked(tx.event.findUniqueOrThrow).mockResolvedValue(event as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(null); // No volunteer ticket
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.unassignTaskFromUser(userId, taskId);

            expect(vi.mocked(deleteEventParticipantWithTx)).not.toHaveBeenCalled();
        });

        it("sends email to reviewer when assignee cancels", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(taskWithEvent as any);
            vi.mocked(tx.event.findUniqueOrThrow).mockResolvedValue(event as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(volunteerParticipant as any);
            vi.mocked(tx.task.count).mockResolvedValue(0);
            vi.mocked(deleteEventParticipantWithTx).mockResolvedValue(undefined);
            vi.mocked(sendMail).mockResolvedValue({ accepted: 1, rejected: 1 });
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.unassignTaskFromUser(userId, taskId);

            expect(vi.mocked(sendMail)).toHaveBeenCalledWith(
                ["reviewer@example.com"],
                "Task updated",
                expect.anything(),
            );
        });

        it("continues even if email fails", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(taskWithEvent as any);
            vi.mocked(tx.event.findUniqueOrThrow).mockResolvedValue(event as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(volunteerParticipant as any);
            vi.mocked(tx.task.count).mockResolvedValue(0);
            vi.mocked(deleteEventParticipantWithTx).mockResolvedValue(undefined);
            vi.mocked(sendMail).mockRejectedValue(new Error("Email service down"));
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await expect(taskActions.unassignTaskFromUser(userId, taskId)).resolves.not.toThrow();
        });

        it("does not send email when task has no reviewer", async () => {
            const taskNoReviewer = { ...taskWithEvent, reviewer: null };
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue(taskNoReviewer as any);
            vi.mocked(tx.event.findUniqueOrThrow).mockResolvedValue(event as any);
            vi.mocked(tx.eventParticipant.findFirst).mockResolvedValue(volunteerParticipant as any);
            vi.mocked(tx.task.count).mockResolvedValue(0);
            vi.mocked(deleteEventParticipantWithTx).mockResolvedValue(undefined);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.unassignTaskFromUser(userId, taskId);

            expect(vi.mocked(sendMail)).not.toHaveBeenCalled();
        });

        it("does not process event logic when task has no event", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.task.update).mockResolvedValue({ event_id: null } as any);
            vi.mocked(mockContext.prisma.$transaction).mockImplementation(async (callback) =>
                callback(tx),
            );

            await taskActions.unassignTaskFromUser(userId, taskId);

            expect(tx.event.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(vi.mocked(deleteEventParticipantWithTx)).not.toHaveBeenCalled();
        });

        it("throws error on invalid user UUID", async () => {
            await expect(
                taskActions.unassignTaskFromUser("invalid-uuid", taskId),
            ).rejects.toThrow();
        });

        it("throws error on invalid task UUID", async () => {
            await expect(
                taskActions.unassignTaskFromUser(userId, "invalid-uuid"),
            ).rejects.toThrow();
        });
    });

    describe("contactTaskMember", () => {
        const sender = {
            id: "sender-id",
            nickname: "SenderNick",
            email: "sender@example.com",
        };

        const recipient = {
            id: userId,
            email: "recipient@example.com",
        };

        const task = {
            id: taskId,
            name: "Important Task",
        };

        beforeEach(() => {
            vi.mocked(getLoggedInUser).mockResolvedValue(sender as any);
            mockContext.prisma.user.findUniqueOrThrow.mockResolvedValue(recipient as any);
            mockContext.prisma.task.findUniqueOrThrow.mockResolvedValue(task as any);
        });

        it("sends email from sender to recipient about task", async () => {
            const formData = buildFormData({
                content: "Please review the task details.",
            });

            await taskActions.contactTaskMember(userId, formData, taskId);

            expect(mockContext.prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: userId },
            });
            expect(mockContext.prisma.task.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: taskId },
            });
            expect(vi.mocked(sendMail)).toHaveBeenCalledWith(
                ["recipient@example.com"],
                "About Important Task",
                expect.anything(),
                "sender@example.com",
            );
        });

        it("sanitizes content before sending", async () => {
            const formData = buildFormData({
                content: "<script>alert('xss')</script><p>Safe message</p>",
            });

            await taskActions.contactTaskMember(userId, formData, taskId);

            expect(vi.mocked(sendMail)).toHaveBeenCalled();
            // The content passed to sendMail should be sanitized
        });

        it("throws error when user not logged in", async () => {
            vi.mocked(getLoggedInUser).mockResolvedValue(null);

            const formData = buildFormData({
                content: "Message content",
            });

            await expect(taskActions.contactTaskMember(userId, formData, taskId)).rejects.toThrow(
                "User must be logged in to contact members",
            );
        });

        it("throws error when task not found", async () => {
            mockContext.prisma.task.findUniqueOrThrow.mockRejectedValue(
                new Error("Task not found"),
            );

            const formData = buildFormData({
                content: "Message content",
            });

            await expect(taskActions.contactTaskMember(userId, formData, taskId)).rejects.toThrow();
        });

        it("throws error on invalid recipient UUID", async () => {
            const formData = buildFormData({
                content: "Message content",
            });

            await expect(
                taskActions.contactTaskMember("invalid-uuid", formData, taskId),
            ).rejects.toThrow();
        });

        it("throws error on invalid task UUID", async () => {
            const formData = buildFormData({
                content: "Message content",
            });

            await expect(
                taskActions.contactTaskMember(userId, formData, "invalid-uuid"),
            ).rejects.toThrow();
        });

        it("throws error on invalid form data", async () => {
            const formData = buildFormData({
                content: "a", // Too short (min 2)
            });

            await expect(taskActions.contactTaskMember(userId, formData, taskId)).rejects.toThrow();
        });

        it("throws error when content is too long", async () => {
            const formData = buildFormData({
                content: "a".repeat(1001), // Max 1000
            });

            await expect(taskActions.contactTaskMember(userId, formData, taskId)).rejects.toThrow();
        });

        it("throws error when recipient not found", async () => {
            mockContext.prisma.user.findUniqueOrThrow.mockRejectedValue(
                new Error("User not found"),
            );

            const formData = buildFormData({
                content: "Message content",
            });

            await expect(taskActions.contactTaskMember(userId, formData, taskId)).rejects.toThrow();
        });
    });
});
