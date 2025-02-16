"use client";

import { Button, Dialog, Stack, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridRowsProp,
  useGridApiRef,
} from "@mui/x-data-grid";
import React, { useEffect, useMemo, useState, startTransition } from "react";
import { datePickerFields, FieldLabels } from "./form/FieldCfg";
import { redirect, usePathname } from "next/navigation";
import GlobalConstants from "../GlobalConstants";
import Form, { FormActionState, defaultActionState as defaultFormActionState } from "./form/Form";
import { useUserContext } from "../context/UserContext";

export interface DatagridActionState {
  status: number;
  errorMsg: string;
  result: any[];
}

export const defaultActionState: DatagridActionState = {
  status: 200,
  errorMsg: "",
  result: [],
};

export interface RowActionProps {
  name: string,
  serverAction: (clickedRow: any, currentActionState: FormActionState) => Promise<FormActionState>,
  available: (clickedRow: any) => boolean,
  buttonColor?: "inherit" | "error" | "secondary" | "primary" | "success" | "info" | "warning"
}

interface DatagridProps {
  name: string;
  fetchData: (
    currentActionState: DatagridActionState,
  ) => Promise<DatagridActionState>;
  updateAction: (
    userId: string,
    currentActionState: FormActionState,
    formData: FormData,
  ) => Promise<FormActionState>,
  rowActions: RowActionProps[],
}

const Datagrid: React.FC<DatagridProps> = ({
  name,
  fetchData,
  updateAction,
  rowActions
}) => {
  const apiRef = useGridApiRef();
  const pathname = usePathname();
  const [clickedRow, setClickedRow] = useState(null);
  const [fetchedDataState, setFetchedDataState] =
    useState<DatagridActionState>(defaultActionState);
  const [dialogActionState, setDialogActionState] = useState(defaultFormActionState)

  const updateDatagridData = async () => {
    const newActionState = await fetchData(fetchedDataState);
    setFetchedDataState(newActionState);
  };

  // Fetch data on first render
  useEffect(() => {
    startTransition(async () => {
      updateDatagridData();
    });
    // Disable lint to only fetch data on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRows = () => {
    if (fetchedDataState.status !== 200) return [];
    const rows: GridRowsProp[] = fetchedDataState.result as GridRowsProp[];
    return rows;
  };

  const getColumns = () => {
    if (fetchedDataState.status !== 200 || fetchedDataState.result.length < 1)
      return [];
    const columns: GridColDef[] = Object.keys(fetchedDataState.result[0]).map(
      (key) => ({
        field: key,
        headerName: key in FieldLabels ? FieldLabels[key] : key,
        type: datePickerFields.includes(key) ? "dateTime" : "string",
      }),
    ) as GridColDef[];
    return columns;
  };

  const rows = useMemo(getRows, [fetchedDataState]);
  const columns = useMemo(getColumns, [fetchedDataState]);

  useEffect(() => {
    apiRef.current.autosizeColumns({
      includeOutliers: true,
      includeHeaders: true,
    });
  }, [apiRef, columns]);

  const onRowClicked = (params: GridRowParams) => setClickedRow(params.row);

  const updateRow = async (
    currentActionState: FormActionState,
    formData: FormData,
  ) => {
    const updateState = await updateAction(
      clickedRow[GlobalConstants.ID],
      currentActionState,
      formData,
    );
    updateDatagridData();
    return updateState;
  };

  const handleRowAction = async (rowAction: RowActionProps) => {
    const rowActionState = await rowAction.serverAction(clickedRow, defaultFormActionState)
    setDialogActionState(rowActionState)
    if (rowActionState.status === 200) updateDatagridData()
  }

  const getRowActionButton = (clickedRow: any, rowAction: RowActionProps) => 
    rowAction.available(clickedRow) && <Button key={rowAction.name} onClick={()=>handleRowAction(rowAction)} color={rowAction.buttonColor || "secondary"}>
          {FieldLabels[rowAction.name]}
        </Button>
  
  const closeDialog = () => {
    setClickedRow(null);
    setDialogActionState(defaultFormActionState);
  };
  return (
    <Stack sx={{ height: "100%" }}>
      <DataGrid
        apiRef={apiRef}
        rows={rows}
        onRowClick={onRowClicked}
        columns={columns}
        autoPageSize
      />
      <Button onClick={() => redirect(`${pathname}/${GlobalConstants.CREATE}`)}>
        Add New
      </Button>
      <Dialog open={!!clickedRow} onClose={closeDialog}>
        <Form
          name={name}
          buttonLabel="save"
          action={updateRow}
          defaultValues={clickedRow}
        />
        {
          dialogActionState.errorMsg && <Typography color="error">{dialogActionState.errorMsg}</Typography>
        }
        {
          dialogActionState.result && <Typography color="success">{dialogActionState.result}</Typography>
        }
        {
          !!rowActions && rowActions.map(rowAction=> getRowActionButton(clickedRow,rowAction))
        }
      </Dialog>
    </Stack>
  );
};

export default Datagrid;
