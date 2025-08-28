import { unstable_cache } from "next/cache";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { getAllEventsWithTasks } from "../../lib/event-actions";
import GlobalConstants from "../../GlobalConstants";
import YearWheelDashboard from "./YearWheelDashboard";

const YearWheelPage = () => {
    const eventsPromise = unstable_cache(getAllEventsWithTasks, [], {
        tags: [GlobalConstants.EVENT],
    })();
    return (
        <ErrorBoundarySuspense>
            <YearWheelDashboard eventsPromise={eventsPromise} />
        </ErrorBoundarySuspense>
    );
};
export default YearWheelPage;
