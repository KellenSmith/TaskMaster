import { prisma } from "../../../prisma/prisma-client";
// ...existing code...
import LocationsDashboard from "./LocationsDashboard";

const LocationsPage = async () => {
    const locationsPromise = prisma.location.findMany();

    return <LocationsDashboard locationsPromise={locationsPromise} />;
};

export default LocationsPage;
