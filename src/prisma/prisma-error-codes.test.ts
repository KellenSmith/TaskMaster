import { describe, expect, it } from "vitest";
import { getUniqueConstraintFields } from "./prisma-error-codes";

describe("getUniqueConstraintFields", () => {
    it("reads fields from legacy Prisma meta.target", () => {
        const fields = getUniqueConstraintFields({ target: ["email", "nickname"] });

        expect(fields).toEqual(["email", "nickname"]);
    });

    it("reads fields from driver adapter metadata", () => {
        const fields = getUniqueConstraintFields({
            modelName: "User",
            driverAdapterError: {
                cause: {
                    kind: "UniqueConstraintViolation",
                    constraint: { fields: ["email", "nickname"] },
                },
            },
        });

        expect(fields).toEqual(["email", "nickname"]);
    });

    it("returns empty array when no fields exist", () => {
        const fields = getUniqueConstraintFields({
            modelName: "User",
            driverAdapterError: {
                cause: {
                    originalCode: "23505",
                },
            },
        });

        expect(fields).toEqual([]);
    });
});
