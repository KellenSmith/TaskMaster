import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import YearWheelDashboard from "./YearWheelDashboard";
import { prisma } from "../../../prisma/prisma-client";

const YearWheelPage = () => {
    const eventsPromise = prisma.event.findMany({
        include: {
            tasks: true,
        },
    })
    return (
        <ErrorBoundarySuspense>
            <YearWheelDashboard eventsPromise={eventsPromise} />
        </ErrorBoundarySuspense>
    );
};
export default YearWheelPage;
