import { prisma } from "../../../prisma/prisma-client";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import LocationsDashboard from "./LocationsDashboard";

const LocationsPage = async () => {
    const locationsPromise = prisma.location.findMany();

    return (
        <ErrorBoundarySuspense>
            <LocationsDashboard locationsPromise={locationsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default LocationsPage;
