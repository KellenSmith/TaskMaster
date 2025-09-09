import { describe, it, expect, vi } from "vitest";
import { render } from "../test/test-utils";
import { mockContext } from "../test/mocks/prismaMock";
import GlobalConstants from "./GlobalConstants";
import React, { ReactElement } from "react";

// Mock before importing component under test
// Mock the TextContent module before importing Home so the mock is used
vi.mock("./ui/TextContent", () => ({
    default: (props: any) => {
        mockTextContent(props);
        return React.createElement("div", { "data-testid": "textcontent-mock" }, props.id);
    },
}));

const mockTextContent = vi.fn();

import HomePage from "./page";

describe("Home", () => {
    it("renders welcome message and delegates to TextContent with proper id prop", async () => {
        const jsx = await HomePage({});
        render(jsx as ReactElement);

        expect(mockTextContent).toHaveBeenCalledTimes(1);
        expect(mockTextContent).toHaveBeenCalledWith(
            expect.objectContaining({ id: GlobalConstants.HOME }),
        );
    });

    it("still renders and calls TextContent when organizationSettings is missing", async () => {
        mockContext.prisma.organizationSettings.findFirst.mockResolvedValue(null);

        const jsx = await HomePage({});
        render(jsx as ReactElement);

        // Even without org settings the TextContent should be invoked with the HOME id
        expect(mockTextContent).toHaveBeenCalledWith(
            expect.objectContaining({ id: GlobalConstants.HOME }),
        );
    });
});
