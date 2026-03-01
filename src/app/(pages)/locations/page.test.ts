import { prisma } from "../../../prisma/prisma-client";
import LocationsPage from "./page";

describe("LocationsPage", () => {
    it("renders locations dashboard with correct data", async () => {
        const locations = [
            { id: "loc-1", name: "Location 1" },
            { id: "loc-2", name: "Location 2" },
        ] as any;
        vi.mocked(prisma.location.findMany).mockResolvedValue(locations);

        const result = await LocationsPage();

        expect(result.props).toStrictEqual({
            locationsPromise: Promise.resolve(locations),
        });
    });
});
