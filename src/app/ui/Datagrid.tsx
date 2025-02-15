'use client'

import { Button, Dialog, Stack } from "@mui/material";
import { DataGrid, GridColDef, GridRowParams, GridRowsProp, useGridApiRef } from '@mui/x-data-grid';
import React, { useEffect, useMemo, useState, startTransition } from "react";
import { datePickerFields, FieldLabels } from "./form/FieldCfg";
import { redirect, usePathname } from "next/navigation";
import GlobalConstants from "../GlobalConstants";
import Form, { FormActionState } from "./form/Form";

export interface DatagridActionState {
  status: number;
  errorMsg: string;
  result: object[];
}

const defaultActionState: DatagridActionState = { status: 200, errorMsg: "", result: [] };

interface DatagridProps {
  name: string,
  fetchData: (currentActionState: DatagridActionState) => Promise<DatagridActionState>;
  updateAction: (userId: string, currentActionState: FormActionState, formData: FormData) => Promise<FormActionState>;
}

const Datagrid: React.FC<DatagridProps> = ({ name, fetchData, updateAction }) => {
  const apiRef = useGridApiRef()
  const pathname = usePathname()
  const [clickedRow, setClickedRow] = useState(null)
  const [actionState, setActionState] = useState<DatagridActionState>(defaultActionState);

  const updateDatagridData = async () => {
    const newActionState = await fetchData(actionState)
      setActionState(newActionState);
  }

  // Fetch data on first render
  useEffect(() => {
    startTransition(async () => {
      updateDatagridData()
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

  const onRowClicked = (params: GridRowParams) => setClickedRow(params.row)

  const updateRow = async (currentActionState: FormActionState, formData: FormData) =>{
    const updateState = await updateAction(clickedRow[GlobalConstants.ID], currentActionState, formData)
    updateDatagridData()
    return updateState
  }
    

  return (
    <Stack sx={{height: '100%'}}>
      <DataGrid apiRef={apiRef} rows={rows} onRowClick={onRowClicked} columns={columns} autoPageSize />
      <Button onClick={() => redirect(`${pathname}/${GlobalConstants.CREATE}`)}>Add New</Button>
      <Dialog open={!!clickedRow} onClose={()=>setClickedRow(null)}>
        <Form name={name} buttonLabel="save" action={updateRow} defaultValues={clickedRow}/>
      </Dialog>
    </Stack>
  );
};

export default Datagrid;