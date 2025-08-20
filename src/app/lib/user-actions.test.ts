import { describe, it, expect } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import { createUser, getAllUsers, updateUser } from "./user-actions";
import testdata from "../../test/testdata";
import { defaultDatagridActionState, defaultFormActionState } from "./definitions";

describe("Create User", () => {
    it("should create a new user successfully", async () => {
        const userToCreate = testdata.createUser;
        const createdUser = testdata.user;

        mockContext.prisma.user.create.mockResolvedValue(createdUser);

        const result = await createUser(defaultFormActionState, userToCreate);
        expect(result.status).toBe(201);
        expect(result.result).toContain("created successfully");
        expect(mockContext.prisma.user.create).toHaveBeenCalledWith({
            data: userToCreate,
        });
    });

    it("should handle create user errors", async () => {
        mockContext.prisma.user.create.mockRejectedValue(new Error("Creation failed"));

        const result = await createUser(defaultFormActionState, testdata.createUser);
        expect(result.status).toBe(500);
        expect(result.errorMsg).toBe("Creation failed");
    });
});

describe("Get All Users", () => {
    it("should get all users with credentials", async () => {
        const mockUsers = [
            { ...testdata.user, id: "1", email: "user1@example.com" },
            { ...testdata.user, id: "2", email: "user2@example.com" },
        ];

        mockContext.prisma.user.findMany.mockResolvedValue(mockUsers);

        const result = await getAllUsers(defaultDatagridActionState);
        expect(result.status).toBe(200);
        expect(result.result).toEqual(mockUsers);
        expect(mockContext.prisma.user.findMany).toHaveBeenCalledWith({
            include: { userCredentials: true, userMembership: true },
        });
    });

    it("should handle get all users error", async () => {
        mockContext.prisma.user.findMany.mockRejectedValue(new Error("Database error"));

        const result = await getAllUsers(defaultDatagridActionState);
        expect(result.status).toBe(500);
        expect(result.result).toEqual([]);
        expect(result.errorMsg).toBe("Database error");
    });
});

describe("Update User", () => {
    it("should update user successfully", async () => {
        const mockUpdate = {
            nickname: "Updated Name",
        };

        mockContext.prisma.user.update.mockResolvedValue({ ...testdata.user, ...mockUpdate });

        const result = await updateUser("1", defaultFormActionState, mockUpdate);
        expect(result.status).toBe(200);
        expect(result.result).toBe("Updated successfully");
        expect(mockContext.prisma.user.update).toHaveBeenCalledWith({
            where: { id: "1" },
            data: mockUpdate,
        });
    });

    it("should handle update user error", async () => {
        mockContext.prisma.user.update.mockRejectedValue(new Error("Update failed"));

        const result = await updateUser("1", defaultFormActionState, { nickname: "test" });
        expect(result.status).toBe(500);
        expect(result.errorMsg).toBe("Update failed");
        expect(result.result).toBeNull();
    });
});
