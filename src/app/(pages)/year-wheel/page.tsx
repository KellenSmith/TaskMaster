import YearWheelDashboard from "./YearWheelDashboard";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import { cacheTag } from "next/cache";

const getCachedEventsWithTasks = async () => {
    "use cache";
    cacheTag(GlobalConstants.EVENT);

    return prisma.event.findMany({
        include: {
            tasks: true,
        },
    });
};

const YearWheelPage = () => {
    const eventsPromise = getCachedEventsWithTasks();
    return <YearWheelDashboard eventsPromise={eventsPromise} />;
};
export default YearWheelPage;
