import HomePage from "./page";
import { vi, describe, it, expect } from "vitest";
import testdata from "../test/testdata";
import { getLoggedInUser } from "./lib/user-actions";
import { getTextContent } from "./lib/text-content-actions";
import { prisma } from "../prisma/prisma-client";
import dayjs from "dayjs";

vi.mock("./lib/user-actions", () => ({
    getLoggedInUser: vi.fn(),
}));
vi.mock("./lib/text-content-actions", () => ({
    getTextContent: vi.fn(),
}));
const mockedNow = dayjs.utc();
beforeEach(() => {
    vi.spyOn(dayjs, "utc").mockReturnValue(mockedNow);
});

const testTicketInfo = [
    {
        id: "participant-1",
        ticket: {
            event: {
                title: "Summer Coding Workshop",
                start_time: new Date("2024-06-15T09:00:00Z"),
                end_time: new Date("2024-06-15T17:00:00Z"),
                location: { name: "Tech Hub, Downtown" },
            },
        },
        user: { id: testdata.user.id, nickname: testdata.user.nickname },
    },
];
// Mock child components
vi.mock("./HomeDashboard", () => ({
    default: () => <div data-testid="home-dashboard">HomeDashboard</div>,
}));

describe("HomePage", () => {
    it("renders TextContent for logged-out user", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);

        await HomePage({});

        expect(vi.mocked(prisma.eventParticipant.findMany)).not.toHaveBeenCalled();
        expect(vi.mocked(getTextContent)).toHaveBeenCalledWith("home");
    });

    it("renders HomeDashboard with tickets for logged-in user", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(testdata.user);
        vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue(testTicketInfo as any);
        vi.mocked(getTextContent).mockResolvedValue({
            id: "home",
            translations: [{ language: "english", text: "Welcome!" }],
        } as any);

        await HomePage({});

        expect(vi.mocked(prisma.eventParticipant.findMany)).toHaveBeenCalledWith({
            where: {
                user_id: testdata.user.id,
                ticket: {
                    event: {
                        end_time: {
                            lt: mockedNow.add(1, "day").toDate(),
                        },
                    },
                },
            },
            include: {
                ticket: {
                    include: {
                        event: {
                            select: {
                                title: true,
                                start_time: true,
                                end_time: true,
                                location: { select: { name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: {
                ticket: {
                    event: {
                        start_time: "asc",
                    },
                },
            },
        });
        expect(vi.mocked(getTextContent)).toHaveBeenCalledWith("home");
    });
});
