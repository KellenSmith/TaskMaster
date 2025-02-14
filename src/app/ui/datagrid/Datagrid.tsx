'use client'

import { Stack } from "@mui/material";
import { DataGrid, GridColDef, GridRowsProp, useGridApiRef } from '@mui/x-data-grid';
import React, { useEffect, useMemo, useState, startTransition } from "react";
import { datePickerFields, FieldLabels } from "../form/FieldCfg";

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
  const apiRef = useGridApiRef()
  const [actionState, setActionState] = useState<DatagridActionState>(defaultActionState);

  // Fetch data on first render
  useEffect(() => {
    startTransition(async () => {
      const newActionState = await fetchData(actionState)
      setActionState(newActionState);
    });
    // Disable lint to only fetch data on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      headerName: key in FieldLabels ? FieldLabels[key] : key,
      type: datePickerFields.includes(key)? "dateTime": "string",
    })) as GridColDef[];
    return columns;
  };

  const rows = useMemo(getRows, [actionState]);
  const columns = useMemo(getColumns, [actionState]);

  useEffect(()=>{
    apiRef.current.autosizeColumns({
      includeOutliers: true,
      includeHeaders: true
    })
  }, [apiRef,columns])

  return (
    <Stack sx={{ height: '100%' }}>
      <DataGrid apiRef={apiRef} rows={rows} columns={columns} autoPageSize />
    </Stack>
  );
};

export default Datagrid;