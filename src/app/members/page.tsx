"use client";

import { Stack } from "@mui/material";
import { deleteUser, getAllUsers, updateUser, validateUserMembership } from "../lib/actions";
import Datagrid, { RowActionProps } from "../ui/Datagrid";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";

const MembersPage = () => {
    const { user } = useUserContext();

    const rowActions: RowActionProps[] = [
        {
            name: GlobalConstants.VALIDATE_MEMBERSHIP,
            serverAction: validateUserMembership,
            available: (clickedRow) =>
                !(clickedRow && clickedRow[GlobalConstants.MEMBERSHIP_RENEWED]),
        },
        {
            name: GlobalConstants.DELETE,
            serverAction: deleteUser,
            available: (clickedRow) =>
                clickedRow && clickedRow[GlobalConstants.ID] !== user[GlobalConstants.ID],
            buttonColor: "error",
        },
    ];
    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.USER}
                fetchData={getAllUsers}
                updateAction={updateUser}
                rowActions={rowActions}
            />
        </Stack>
    );
};

export default MembersPage;
