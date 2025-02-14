'use client'

import { Stack } from "@mui/material";
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import React, { useEffect, useMemo, useState, startTransition } from "react";
import { FieldLabels } from "../form/FieldCfg";

export interface DatagridActionState {
  status: number;
  errorMsg: string;
  result: object[];
}

const defaultActionState: DatagridActionState = { status: 200, errorMsg: "", result: [] };

interface DatagridProps {
  fetchData: (currentActionState: DatagridActionState) => Promise<DatagridActionState>;
}

const Datagrid: React.FC<DatagridProps> = ({ fetchData }) => {
  const [actionState, setActionState] = useState<DatagridActionState>(defaultActionState);

  // Fetch data on first render
  useEffect(() => {
    startTransition(() => {
      fetchData(actionState).then((newActionState) => {
        setActionState(newActionState);
      });
    });
  }, []);

  const getRows = () => {
    if (actionState.status !== 200) return [];
    const rows: GridRowsProp[] = actionState.result as GridRowsProp[];
    return rows;
  };

  const getColumns = () => {
    if (actionState.status !== 200 || actionState.result.length < 1) return [];
    const columns: GridColDef[] = Object.keys(actionState.result[0]).map(key => ({
      field: key,
      headerName: key in FieldLabels ? FieldLabels[key] : key
    })) as GridColDef[];
    return columns;
  };

  const rows = useMemo(getRows, [actionState]);
  const columns = useMemo(getColumns, [actionState]);

  return (
    <Stack sx={{ height: '100%' }}>
      <DataGrid autoPageSize rows={rows} columns={columns} />
    </Stack>
  );
};

export default Datagrid;