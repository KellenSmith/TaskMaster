import { describe, it, expect, vi } from "vitest";
import TicketPage from "./page";
import { prisma } from "../../../prisma/prisma-client";
import { getLoggedInUser } from "../../lib/user-helpers";
import { UserRole } from "../../../prisma/generated/enums";
import dayjs from "dayjs";
import { ReactElement } from "react";
import testdata from "../../../test/testdata";
import GlobalConstants from "../../GlobalConstants";

// Mock child component to not have to call contexts and other dependencies
vi.mock("./TicketDashboard", () => ({
    default: () => <div data-testid="ticket-dashboard" />,
}));
vi.mock("../../lib/user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

const mockSearchParams = Promise.resolve({ eventParticipantId: "ep-1" });
const mockEventParticipant = {
    id: "ep-1",
    ticket: { event: { title: "Event 1", tasks: [] } },
    user_id: "user-1",
};

// [userRole, eventHost, eventVolunteer, eventParticipant]
const authorizedTestCases = [
    [UserRole.admin, false, false, false],
    [UserRole.admin, true, false, false],
    [UserRole.admin, true, true, false],
    [UserRole.member, true, false, false],
    [UserRole.member, true, true, false],
    [UserRole.member, false, true, false],
    [UserRole.member, false, false, true],
];

type TicketPageElementProps = {
    name: string;
    children: ReactElement<{ eventParticipantPromise: Promise<unknown> }>;
};

type TicketDashboardElementProps = {
    eventParticipantPromise: Promise<unknown>;
};

describe("TicketPage", () => {
    it.for(authorizedTestCases)(
        "returns ProtectedPage and allows viewing ticket when user role is %s, event host: %s, event volunteer: %s, event participant: %s",
        async ([userRole, eventHost, eventVolunteer, eventParticipant]) => {
            const mockedUserWithRole = {
                ...testdata.user,
                role: userRole,
            };
            vi.mocked(getLoggedInUser).mockResolvedValue(mockedUserWithRole as any);
            const mockEventParticipantWithConditions = {
                id: "ep-1",
                ticket: {
                    event: {
                        title: "Event 1",
                        host_id: eventHost ? mockedUserWithRole.id : "other-host",
                        tasks: eventVolunteer ? [{ id: "task-1" }] : [],
                    },
                },
                user_id: eventParticipant ? mockedUserWithRole.id : "other-user",
            };
            vi.mocked(prisma.eventParticipant.findUnique).mockResolvedValue(
                mockEventParticipantWithConditions as any,
            );

            const result = (await TicketPage({
                searchParams: mockSearchParams,
            })) as ReactElement<TicketPageElementProps>;

            expect(result.props.name).toBe(GlobalConstants.TICKET);

            const ticketDashboard = result.props
                .children as ReactElement<TicketDashboardElementProps>;

            await expect(ticketDashboard.props.eventParticipantPromise).resolves.toStrictEqual(
                mockEventParticipantWithConditions,
            );
            // Query execution is deferred until the promise is consumed.
            expect(prisma.eventParticipant.findUnique).toHaveBeenCalledWith({
                where: { id: "ep-1" },
                include: {
                    ticket: {
                        include: {
                            event: {
                                include: {
                                    tasks: {
                                        where: { assignee_id: mockedUserWithRole.id },
                                        select: { id: true },
                                    },
                                },
                            },
                        },
                    },
                    user: { select: { id: true, nickname: true } },
                },
            });
            expect(ticketDashboard.props).toHaveProperty("eventParticipantPromise");
        },
    );

    it("renders dashboard even if eventParticipant is not found", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(testdata.user as any);
        vi.mocked(prisma.eventParticipant.findUnique).mockResolvedValue(null);

        const result = (await TicketPage({
            searchParams: mockSearchParams,
        })) as ReactElement<TicketPageElementProps>;

        expect(result.props.name).toBe(GlobalConstants.TICKET);

        const ticketDashboard = result.props.children as ReactElement<TicketDashboardElementProps>;

        await expect(ticketDashboard.props.eventParticipantPromise).resolves.toBe(null);
    });
});
