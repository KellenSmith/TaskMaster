import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import ProtectedPage from "../../ProtectedPage";
import LocationsDashboard from "./LocationsDashboard";

const getCachedLocations = async () => {
    return await prisma.location.findMany();
};

const LocationsPage = async () => {
    const locationsPromise = getCachedLocations();

    return (
        <ProtectedPage name={GlobalConstants.LOCATIONS}>
            <LocationsDashboard locationsPromise={locationsPromise} />
        </ProtectedPage>
    );
};

export default LocationsPage;
