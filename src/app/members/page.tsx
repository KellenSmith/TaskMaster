import { Stack } from "@mui/material";
import { getAllUsers } from "../lib/actions";
import Datagrid from "../ui/Datagrid";

const MembersPage = () => {

    return (
        <Stack sx={{height: '100%'}}>
            <Datagrid fetchData={getAllUsers}/>
        </Stack>
    );
  };
  
  export default MembersPage;