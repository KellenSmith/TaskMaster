import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { getOrganizationSettings } from "../../lib/organization-settings-actions";
import { processNextNewsletterBatch } from "../../lib/mail-service/newsletter-actions";
import { prisma } from "../../../prisma/prisma-client";
import dayjs from "dayjs";
import { sendMail } from "../../lib/mail-service/mail-service";
import {
    expiringMembershipMaintenance,
    processNewsletterBacklog,
    purgeStaleMembershipApplications,
} from "./cron";

vi.mock("react", async () => ({
    createElement: vi.fn(),
}));
vi.mock("../../lib/mail-service/mail-service", () => ({
    sendMail: vi.fn(),
}));
vi.mock("../../lib/mail-service/newsletter-actions", () => ({
    processNextNewsletterBatch: vi.fn(),
}));
vi.mock("../../lib/organization-settings-actions", () => ({
    getOrganizationSettings: vi.fn(),
}));

const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

const mockedNow = dayjs.utc();
beforeEach(() => {
    vi.spyOn(dayjs, "utc").mockReturnValue(mockedNow);
});

describe("cron jobs", () => {
    describe("purgeStaleMembershipApplications", () => {
        const mockPurgeDays = 10;
        beforeEach(() => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                purge_members_after_days_unvalidated: mockPurgeDays,
            } as any);
        });

        it("purges users with no membership older than threshold", async () => {
            vi.mocked(prisma.user.deleteMany).mockResolvedValue({ count: 3 });

            await purgeStaleMembershipApplications();

            expect(prisma.user.deleteMany).toHaveBeenCalledWith({
                where: {
                    user_membership: null,
                    created_at: {
                        lt: dayjs.utc().subtract(mockPurgeDays, "d").toDate(),
                    },
                },
            });
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Purged 3 stale membership application(s)"),
            );
        });
        it("uses default threshold if orgSettings.purge_members_after_days_unvalidated is undefined", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({} as any);
            vi.mocked(prisma.user.deleteMany).mockResolvedValue({ count: 1 });
            const mockDayjs = {
                subtract: vi.fn().mockReturnThis(),
                toDate: vi.fn().mockReturnValue(new Date("2026-01-01T00:00:00.000Z")),
            };
            vi.spyOn(dayjs, "utc").mockReturnValue(mockDayjs as any);
            await purgeStaleMembershipApplications();
            expect(prisma.user.deleteMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ user_membership: null }),
                }),
            );
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Purged 1 stale membership application(s)"),
            );
        });
        it("logs and throws on error", async () => {
            vi.mocked(getOrganizationSettings).mockRejectedValue(new Error("fail"));

            await expect(purgeStaleMembershipApplications()).rejects.toThrow("fail");

            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error when purging stale memberships: fail"),
            );
        });
    });

    describe("expiringMembershipMaintenance", () => {
        const mockReminderDays = 5;
        beforeEach(() => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                remind_membership_expires_in_days: mockReminderDays,
            } as any);
        });

        it("sends reminders to expiring users", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({
                remind_membership_expires_in_days: mockReminderDays,
            } as any);
            vi.mocked(prisma.user.findMany).mockResolvedValue([
                { email: "a@test.com", user_membership: { membership: { product: {} } } },
                { email: "b@test.com", user_membership: { membership: { product: {} } } },
            ] as any);
            vi.mocked(createElement).mockReturnValue({} as any);

            await expiringMembershipMaintenance();

            expect(sendMail).toHaveBeenCalledWith(
                ["a@test.com", "b@test.com"],
                expect.stringContaining("membership is about to expire"),
                expect.anything(),
            );
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Reminded about 2 expiring membership(s)"),
            );
        });
        it("uses default reminderDays if orgSettings.remind_membership_expires_in_days is undefined", async () => {
            vi.mocked(getOrganizationSettings).mockResolvedValue({} as any);
            vi.mocked(prisma.user.findMany).mockResolvedValue([
                { email: "c@test.com", user_membership: { membership: { product: {} } } },
            ] as any);
            vi.mocked(createElement).mockReturnValue({} as any);
            await expiringMembershipMaintenance();
            expect(sendMail).toHaveBeenCalledWith(
                ["c@test.com"],
                expect.stringContaining("membership is about to expire"),
                expect.anything(),
            );
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Reminded about 1 expiring membership(s)"),
            );
        });
        it("does not send mail and logs if no expiring users (coverage for expiringUsers.length === 0)", async () => {
            vi.mocked(prisma.user.findMany).mockResolvedValue([]);
            await expiringMembershipMaintenance();
            expect(sendMail).not.toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Reminded about 0 expiring membership(s)"),
            );
        });
        it("logs and throws on error", async () => {
            vi.mocked(prisma.user.findMany).mockResolvedValue([
                { email: "a@test.com", user_membership: { membership: { product: {} } } },
            ] as any);
            vi.mocked(sendMail).mockRejectedValue(new Error("mailfail"));
            vi.mocked(createElement).mockReturnValue({} as any);

            await expect(expiringMembershipMaintenance()).rejects.toThrow("mailfail");
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Error when reminding about expiring memberships: mailfail",
                ),
            );
        });
    });

    describe("processNewsletterBacklog", () => {
        it("processes newsletter batches until done", async () => {
            vi.mocked(processNextNewsletterBatch)
                .mockResolvedValueOnce({
                    processed: 2,
                    done: false,
                })
                .mockResolvedValueOnce({
                    processed: 3,
                    done: true,
                })
                .mockResolvedValueOnce({
                    processed: 0,
                    done: true,
                });

            await processNewsletterBacklog();

            expect(vi.mocked(processNextNewsletterBatch)).toHaveBeenCalledTimes(2);
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Cron job processed 5 newsletter recipients across 2 batches",
                ),
            );
        });
        it("logs if no jobs found", async () => {
            vi.mocked(processNextNewsletterBatch).mockResolvedValue({ processed: 0, done: true });

            await processNewsletterBacklog();

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("No pending newsletter jobs found"),
            );
        });
        it("logs and throws on error", async () => {
            vi.mocked(processNextNewsletterBatch).mockRejectedValue(new Error("fail"));

            await expect(processNewsletterBacklog()).rejects.toThrow("fail");
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error in newsletter backlog processing: fail"),
            );
        });
        it("logs and throws on non-Error thrown value", async () => {
            vi.mocked(processNextNewsletterBatch).mockRejectedValue("fail-string");

            await expect(processNewsletterBacklog()).rejects.toThrow("fail-string");
            expect(errorSpy).not.toHaveBeenCalled();
        });
        it("stops processing if time limit is reached", async () => {
            const origDateNow = Date.now;
            let fakeNow = 1000;
            global.Date.now = () => (fakeNow += 20000); // Each call advances time by 20s
            vi.mocked(processNextNewsletterBatch).mockResolvedValue({ processed: 1, done: false });

            await processNewsletterBacklog();

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Newsletter cron stopping due to time limit"),
            );
            global.Date.now = origDateNow;
        });
    });
});
