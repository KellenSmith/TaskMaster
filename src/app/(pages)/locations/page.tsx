import { prisma } from "../../../prisma/prisma-client";
import LocationsDashboard from "./LocationsDashboard";

const getCachedLocations = async () => {
    return await prisma.location.findMany();
};

const LocationsPage = async () => {
    const locationsPromise = getCachedLocations();

    return <LocationsDashboard locationsPromise={locationsPromise} />;
};

export default LocationsPage;
