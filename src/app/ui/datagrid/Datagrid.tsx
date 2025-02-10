'use client'

import { Stack } from "@mui/material";
import {DataGrid, GridColDef, GridRowsProp} from '@mui/x-data-grid'

interface DatagridProps {
    rows: GridRowsProp[];
    columns: GridColDef[];
}

const Datagrid = ({ rows, columns }: DatagridProps) => {  
    return (
        <div>
            <Stack>
                <DataGrid autosizeOnMount autoPageSize rows={rows} columns={columns} />
            </Stack>
        </div>
    );
};

export default Datagrid;