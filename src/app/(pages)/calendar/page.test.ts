import dayjs from "../../lib/dayjs";
import { UserRole } from "../../../prisma/generated/enums";
import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import CalendarPage from "./page";

vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

const mockUser = {
    id: "user-id",
    role: UserRole.admin,
    user_membership: { expires_at: dayjs().add(1, "day").toDate() },
};

describe("CalendarPage", async () => {
    beforeEach(() => {
        vi.mocked(prisma.location.findMany).mockResolvedValue([]);
    });
    it("fetches all events for admin users", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(mockUser as any);
        const mockEvents = [
            { id: "event1", status: "published", host_id: "host1" },
            { id: "event2", status: "draft", host_id: "host2" },
        ];
        vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents as any);

        const result = await CalendarPage();

        expect(prisma.event.findMany).toHaveBeenCalledWith({
            where: {},
        });
        expect(prisma.location.findMany).toHaveBeenCalled();
        expect(result.props).toStrictEqual({
            eventsPromise: Promise.resolve(mockEvents),
            locationsPromise: Promise.resolve([]),
        });
    });
    it("fetches no events for expired members", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({
            ...mockUser,
            user_membership: { expires_at: dayjs().subtract(1, "day").toDate() },
        } as any);

        await expect(async () => await CalendarPage()).rejects.toThrow("Unauthorized");
        expect(prisma.event.findMany).not.toHaveBeenCalled();
        expect(prisma.location.findMany).not.toHaveBeenCalled();
    });
    it("fetches all published events and their own event drafts for regular users", async () => {
        const regularUser = {
            ...mockUser,
            role: UserRole.member,
        };
        vi.mocked(getLoggedInUser).mockResolvedValue(regularUser as any);
        const mockEvents = [
            { id: "event1", status: "published", host_id: "host1" },
            { id: "event2", status: "draft", host_id: regularUser.id },
            { id: "event3", status: "draft", host_id: "other-host" },
        ];
        vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents as any);

        const result = await CalendarPage();

        expect(prisma.event.findMany).toHaveBeenCalledWith({
            where: {
                OR: [{ status: "published" }, { host_id: regularUser.id }],
            },
        });
        expect(prisma.location.findMany).toHaveBeenCalled();
        expect(result.props).toStrictEqual({
            eventsPromise: Promise.resolve(mockEvents),
            locationsPromise: Promise.resolve([]),
        });
    });
    it("fetches no events for non-logged in users", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);

        await expect(async () => await CalendarPage()).rejects.toThrow("Unauthorized");
        expect(prisma.event.findMany).not.toHaveBeenCalled();
        expect(prisma.location.findMany).not.toHaveBeenCalled();
    });
});
