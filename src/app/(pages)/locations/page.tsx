import { getAllLocations } from "../../lib/location-actions";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import LocationsDashboard from "./LocationsDashboard";

const LocationsPage = async () => {
    const locationsPromise = getAllLocations();

    return (
        <ErrorBoundarySuspense>
            <LocationsDashboard locationsPromise={locationsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default LocationsPage;
