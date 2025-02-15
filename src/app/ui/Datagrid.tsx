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
import Form, { FormActionState } from "./form/Form";
import { useUserContext } from "../context/UserContext";

export interface DatagridActionState {
  status: number;
  errorMsg: string;
  result: object[];
}

export const defaultActionState: DatagridActionState = {
  status: 200,
  errorMsg: "",
  result: [],
};

interface DatagridProps {
  name: string;
  fetchData: (
    currentActionState: DatagridActionState,
  ) => Promise<DatagridActionState>;
  updateAction: (
    userId: string,
    currentActionState: FormActionState,
    formData: FormData,
  ) => Promise<FormActionState>;
  deleteAction: (
    userId: string,
    currentActionState: DatagridActionState,
  ) => Promise<DatagridActionState>;
}

const Datagrid: React.FC<DatagridProps> = ({
  name,
  fetchData,
  updateAction,
  deleteAction,
}) => {
  const apiRef = useGridApiRef();
  const pathname = usePathname();
  const [clickedRow, setClickedRow] = useState(null);
  const [fetchedDataState, setFetchedDataState] =
    useState<DatagridActionState>(defaultActionState);
  const [dialogErrorMsg, setDialogErrorMsg] = useState("");
  const { user } = useUserContext();

  const updateDatagridData = async () => {
    const newActionState = await fetchData(fetchedDataState);
    setFetchedDataState(newActionState);
    if (newActionState.status !== 200)
      setDialogErrorMsg(newActionState.errorMsg);
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

  const deleteRow = async () => {
    if (clickedRow[GlobalConstants.ID] === user[GlobalConstants.ID])
      return setDialogErrorMsg("You can't delete your own user");
    const deleteState = await deleteAction(
      clickedRow[GlobalConstants.EMAIL],
      fetchedDataState,
    );
    if (deleteState.status !== 200)
      return setDialogErrorMsg(deleteState.errorMsg);
    updateDatagridData();
  };

  const closeDialog = () => {
    setClickedRow(null);
    setDialogErrorMsg("");
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
        {!!dialogErrorMsg && (
          <Typography color="error">{dialogErrorMsg}</Typography>
        )}
        <Button color="error" onClick={deleteRow}>
          Delete
        </Button>
      </Dialog>
    </Stack>
  );
};

export default Datagrid;
