import YearWheelDashboard from "./YearWheelDashboard";
import { prisma } from "../../../prisma/prisma-client";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";
import { serverRedirect } from "../../lib/utils";

const getCachedEventsWithTasks = async () => {
    return prisma.event.findMany({
        include: {
            tasks: true,
        },
    });
};

const YearWheelPage = () => {
    serverRedirect([GlobalConstants.HOME]);
    const eventsPromise = getCachedEventsWithTasks();
    return (
        <ProtectedPage name={GlobalConstants.YEAR_WHEEL}>
            <YearWheelDashboard eventsPromise={eventsPromise} />
        </ProtectedPage>
    );
};
export default YearWheelPage;
