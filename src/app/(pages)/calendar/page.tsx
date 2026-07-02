import CalendarDashboard from "./CalendarDashboard";
import { getLoggedInUser } from "../../lib/user-helpers";
import { isUserAdmin } from "../../lib/utils";
import { prisma } from "../../../prisma/prisma-client";
import { EventStatus, Prisma } from "../../../prisma/generated/client";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";

const getEvents = async (userId: string | null, isAdmin: boolean) => {
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
    return await prisma.location.findMany();
};

const CalendarPage = async () => {
    const loggedInUser = await getLoggedInUser();

    return (
        <ProtectedPage name={GlobalConstants.CALENDAR}>
            <CalendarDashboard
                eventsPromise={getEvents(loggedInUser?.id ?? null, isUserAdmin(loggedInUser))}
                locationsPromise={getLocations()}
            />
        </ProtectedPage>
    );
};

export default CalendarPage;
