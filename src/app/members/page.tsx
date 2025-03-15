"use client";

import { Stack } from "@mui/material";
import { deleteUser, getAllUsers, updateUser, validateUserMembership } from "../lib/user-actions";
import Datagrid, { RowActionProps } from "../ui/Datagrid";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import { GridColDef } from "@mui/x-data-grid";
import { FieldLabels } from "../ui/form/FieldCfg";
import { isMembershipExpired } from "../lib/definitions";

const MembersPage = () => {
    const { user } = useUserContext();

    const isMembershipPending = (user) => !user[GlobalConstants.USER_CREDENTIALS];

    const rowActions: RowActionProps[] = [
        {
            name: GlobalConstants.VALIDATE_MEMBERSHIP,
            serverAction: validateUserMembership,
            available: (clickedRow) => clickedRow && isMembershipPending(clickedRow),
        },
        {
            name: GlobalConstants.DELETE,
            serverAction: deleteUser,
            available: (clickedRow) =>
                clickedRow && clickedRow[GlobalConstants.ID] !== user[GlobalConstants.ID],
            buttonColor: "error",
        },
    ];

    const customColumns: GridColDef[] = [
        {
            field: GlobalConstants.STATUS,
            headerName: FieldLabels[GlobalConstants.STATUS],
            valueGetter: (_, row) => {
                let status = GlobalConstants.ACTIVE;
                if (isMembershipPending(row)) status = GlobalConstants.PENDING;
                else if (isMembershipExpired(row)) status = GlobalConstants.EXPIRED;
                return FieldLabels[status] || status;
            },
        },
        {
            field: "newsletters",
            headerName: "Newsletters",
            valueGetter: (_, row) => row[GlobalConstants.CONSENT_TO_NEWSLETTERS],
        },
    ];

    const hiddenColumns = [
        GlobalConstants.ID,
        GlobalConstants.USER_CREDENTIALS,
        GlobalConstants.CONSENT_TO_NEWSLETTERS,
    ];

    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.USER}
                fetchData={getAllUsers}
                updateAction={updateUser}
                rowActions={rowActions}
                customColumns={customColumns}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default MembersPage;
