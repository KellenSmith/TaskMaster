import { Stack } from "@mui/material";
import { deleteUser, getAllUsers, updateUser, validateUserMembership } from "../lib/actions";
import Datagrid from "../ui/Datagrid";
import GlobalConstants from "../GlobalConstants";
import { FormActionState } from "../ui/form/Form";

const MembersPage = () => {

  const prepareMembershipValidation = async (clickedRow: any, currentActionState: FormActionState): Promise<FormActionState> => {
    'use server'
    const validateState = await validateUserMembership(clickedRow[GlobalConstants.EMAIL], currentActionState)
    return validateState
  }

  return (
    <Stack sx={{ height: "100%" }}>
      <Datagrid
        name={GlobalConstants.USER}
        fetchData={getAllUsers}
        updateAction={updateUser}
        deleteAction={deleteUser}
        validateAction={prepareMembershipValidation}
      />
    </Stack>
  );
};

export default MembersPage;
