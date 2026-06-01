import CalendarDashboard from "./CalendarDashboard";
import { getLoggedInUser } from "../../lib/user-helpers";
import { isUserAdmin } from "../../lib/utils";
import { prisma } from "../../../prisma/prisma-client";
import { EventStatus, Prisma } from "../../../prisma/generated/client";
import { cacheTag } from "next/cache";
import GlobalConstants from "../../GlobalConstants";

const getEvents = async (userId: string | null, isAdmin: boolean) => {
    "use cache";
    cacheTag(GlobalConstants.EVENT);

    const eventFilterParams = {} as Prisma.EventWhereInput;

    // Non-admins can only see their own event drafts and pending approval events or published events
    if (userId && !isAdmin) {
        eventFilterParams.OR = [
            {
                status: EventStatus.published,
            },
            { host_id: userId },
        ];
    }

    return await prisma.event.findMany({
        where: eventFilterParams,
    });
};

const getLocations = async () => {
    "use cache";
    cacheTag(GlobalConstants.LOCATION);

    return await prisma.location.findMany();
};

const CalendarPage = async () => {
    const loggedInUser = await getLoggedInUser();

    return (
        <CalendarDashboard
            eventsPromise={getEvents(loggedInUser?.id ?? null, isUserAdmin(loggedInUser))}
            locationsPromise={getLocations()}
        />
    );
};

export default CalendarPage;
