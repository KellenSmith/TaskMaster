import { prisma } from "../../../prisma/prisma-client";
import GlobalConstants from "../../GlobalConstants";
import LocationsPage from "./page";
import { ReactElement } from "react";

vi.mock("../../ProtectedPage", () => ({
    default: vi.fn(({ children }) => children),
}));

describe("LocationsPage", () => {
    it("renders locations dashboard with correct data", async () => {
        const locations = [
            { id: "loc-1", name: "Location 1" },
            { id: "loc-2", name: "Location 2" },
        ] as any;
        vi.mocked(prisma.location.findMany).mockResolvedValue(locations);

        const result = await LocationsPage();

        const props = result.props as {
            name: string;
            children: ReactElement<{ locationsPromise: Promise<unknown> }>;
        };

        expect(props.name).toBe(GlobalConstants.LOCATIONS);

        await expect(props.children.props.locationsPromise).resolves.toStrictEqual(locations);
    });
});
