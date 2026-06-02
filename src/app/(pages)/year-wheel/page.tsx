import YearWheelDashboard from "./YearWheelDashboard";
import { prisma } from "../../../prisma/prisma-client";

const getCachedEventsWithTasks = async () => {
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
