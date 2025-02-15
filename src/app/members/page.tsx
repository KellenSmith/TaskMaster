import { Stack } from "@mui/material";
import { getAllUsers, updateUser } from "../lib/actions";
import Datagrid from "../ui/Datagrid";
import GlobalConstants from "../GlobalConstants";

const MembersPage = () => {


    return (
        <Stack sx={{height: '100%'}}>
            <Datagrid name={GlobalConstants.USER} fetchData={getAllUsers} updateAction={updateUser}/>
        </Stack>
    );
  };
  
  export default MembersPage;