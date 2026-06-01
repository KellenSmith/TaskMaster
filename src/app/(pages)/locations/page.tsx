import { cacheTag } from "next/cache";
import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import LocationsDashboard from "./LocationsDashboard";

const getCachedLocations = async () => {
    "use cache";
    cacheTag(GlobalConstants.LOCATION);

    return await prisma.location.findMany();
};

const LocationsPage = async () => {
    const locationsPromise = getCachedLocations();

    return <LocationsDashboard locationsPromise={locationsPromise} />;
};

export default LocationsPage;
