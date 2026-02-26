"use server";
import CalendarDashboard from "./CalendarDashboard";
import { getLoggedInUser } from "../../lib/user-helpers";
// ...existing code...
import { isUserAdmin } from "../../lib/utils";
import { prisma } from "../../../prisma/prisma-client";
import { EventStatus, Prisma } from "../../../prisma/generated/client";

const CalendarPage = async () => {
    const loggedInUser = await getLoggedInUser();

    const eventFilterParams = {} as Prisma.EventWhereInput;

    // Non-admins can only see their own event drafts and pending approval events or published events
    if (loggedInUser && !isUserAdmin(loggedInUser)) {
        eventFilterParams.OR = [
            {
                status: EventStatus.published,
            },
            { host_id: loggedInUser.id },
        ];
    }

    const eventsPromise = prisma.event.findMany({
        where: eventFilterParams,
    });
    const locationsPromise = prisma.location.findMany();

    return <CalendarDashboard eventsPromise={eventsPromise} locationsPromise={locationsPromise} />;
};

export default CalendarPage;
