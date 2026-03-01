// ...existing code...
import YearWheelDashboard from "./YearWheelDashboard";
import { prisma } from "../../../prisma/prisma-client";

const YearWheelPage = () => {
    const eventsPromise = prisma.event.findMany({
        include: {
            tasks: true,
        },
    });
    return <YearWheelDashboard eventsPromise={eventsPromise} />;
};
export default YearWheelPage;
