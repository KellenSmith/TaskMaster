'use client'

import { Stack } from "@mui/material";
import {DataGrid, GridColDef, GridRowsProp} from '@mui/x-data-grid'
import React from "react";

interface DatagridProps {
    rows: GridRowsProp[];
    columns: GridColDef[];
}

const Datagrid: React.FC<DatagridProps> = ({ rows, columns }) => {  
    return (
            <Stack sx={{height: '100%'}}>
                <DataGrid autosizeOnMount autoPageSize rows={rows} columns={columns} />
            </Stack>
    );
};

export default Datagrid;