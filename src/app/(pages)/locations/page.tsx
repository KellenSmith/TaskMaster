import { getAllLocations } from "../../lib/location-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import LocationsDashboard from "./LocationsDashboard";
import { unstable_cache } from "next/cache";
import GlobalConstants from "../../GlobalConstants";

const LocationsPage = async () => {
    const locationsPromise = unstable_cache(getAllLocations, [], {
        tags: [GlobalConstants.LOCATION],
    })();

    return (
        <ErrorBoundarySuspense>
            <LocationsDashboard locationsPromise={locationsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default LocationsPage;
