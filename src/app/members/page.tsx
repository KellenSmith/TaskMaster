import { Stack } from "@mui/material";
import {GridColDef, GridRowsProp} from '@mui/x-data-grid'
import { getAllUsers } from "../lib/actions";
import Datagrid from "../ui/datagrid/Datagrid";

export interface DatagridActionState {
    status: number;
    errorMsg: string;
    result: object[];
  }
  
const defaultActionState: DatagridActionState = { status: 200, errorMsg: "", result: [] };

const MembersPage = async () => {
    const fetchedData: DatagridActionState = await getAllUsers(defaultActionState)

    const getRows = ()=>{
        if (fetchedData.status !== 200) return []
        const rows: GridRowsProp[] = fetchedData.result as GridRowsProp[]
        return rows
    }

    const getColumns=()=>{
        if (fetchedData.status !== 200||fetchedData.result.length<1) return []
        const columns: GridColDef[] = Object.keys(fetchedData.result[0]).map(key=>({field: key})) as GridColDef[]
        return columns
    }

    return (
        <Stack sx={{height: '100%'}}>
            <Datagrid rows={getRows()} columns={getColumns()}/>
        </Stack>
    );
  };
  
  export default MembersPage;