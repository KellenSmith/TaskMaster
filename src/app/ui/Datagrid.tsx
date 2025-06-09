"use client";

import { Button, Dialog, Stack } from "@mui/material";
import { DataGrid, GridColDef, GridRowParams, GridRowsProp, useGridApiRef } from "@mui/x-data-grid";
import React, { useEffect, useMemo, useState, startTransition } from "react";
import { datePickerFields, FieldLabels } from "./form/FieldCfg";
import { usePathname, useRouter } from "next/navigation";
import GlobalConstants from "../GlobalConstants";
import Form, {
    FormActionState,
    defaultActionState as defaultFormActionState,
    getFormActionMsg,
} from "./form/Form";
import ConfirmButton from "./ConfirmButton";
import { navigateToRoute } from "./utils";

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
    name: string;
    serverAction: (
        clickedRow: any, // eslint-disable-line no-unused-vars
        currentActionState: FormActionState, // eslint-disable-line no-unused-vars
    ) => Promise<FormActionState>;
    available: (clickedRow: any) => boolean; // eslint-disable-line no-unused-vars
    buttonColor?: "inherit" | "error" | "secondary" | "primary" | "success" | "info" | "warning";
}

interface DatagridProps {
    name: string;
    fetchData: (currentActionState: DatagridActionState) => Promise<DatagridActionState>; // eslint-disable-line no-unused-vars
    updateAction: (
        userId: string, // eslint-disable-line no-unused-vars
        currentActionState: FormActionState, // eslint-disable-line no-unused-vars
        fieldValues: any, // eslint-disable-line no-unused-vars
    ) => Promise<FormActionState>;
    rowActions: RowActionProps[];
    customColumns?: GridColDef[];
    hiddenColumns?: string[];
}

const Datagrid: React.FC<DatagridProps> = ({
    name,
    fetchData,
    updateAction,
    rowActions,
    customColumns = [],
    hiddenColumns = [],
}) => {
    const apiRef = useGridApiRef();
    const pathname = usePathname();
    const [clickedRow, setClickedRow] = useState(null);
    const [fetchedDataState, setFetchedDataState] =
        useState<DatagridActionState>(defaultActionState);
    const [dialogActionState, setDialogActionState] = useState(defaultFormActionState);
    const router = useRouter();

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
        setClickedRow((prev) =>
            prev ? rows.find((row) => row[GlobalConstants.ID] === prev[GlobalConstants.ID]) : null,
        );
        return rows;
    };

    const getColumns = () => {
        if (fetchedDataState.status !== 200 || fetchedDataState.result.length < 1) return [];
        const columns: GridColDef[] = Object.keys(fetchedDataState.result[0]).map((key) => ({
            field: key,
            headerName: key in FieldLabels ? FieldLabels[key] : key,
            type: datePickerFields.includes(key) ? "dateTime" : "string",
        })) as GridColDef[];
        return [...columns, ...customColumns];
    };

    const rows = useMemo(getRows, [fetchedDataState]);
    const columns = useMemo(getColumns, [fetchedDataState, customColumns]);

    useEffect(() => {
        apiRef.current.autosizeColumns({
            includeOutliers: true,
            includeHeaders: true,
        });
    }, [apiRef, columns]);

    const onRowClicked = (params: GridRowParams) => setClickedRow(params.row);

    const updateRow = async (currentActionState: FormActionState, fieldValues: any) => {
        const updateState = await updateAction(
            clickedRow[GlobalConstants.ID],
            currentActionState,
            fieldValues,
        );
        updateDatagridData();
        return updateState;
    };

    const handleRowAction = async (rowAction: RowActionProps) => {
        const rowActionState = await rowAction.serverAction(clickedRow, defaultFormActionState);
        setDialogActionState(rowActionState);
        if (rowActionState.status === 200) updateDatagridData();
    };

    const getRowActionButton = (clickedRow: any, rowAction: RowActionProps) => {
        const ButtonComponent = rowAction.buttonColor === "error" ? ConfirmButton : Button;
        return (
            rowAction.available(clickedRow) && (
                <ButtonComponent
                    key={rowAction.name}
                    onClick={() => handleRowAction(rowAction)}
                    color={rowAction.buttonColor || "secondary"}
                >
                    {FieldLabels[rowAction.name]}
                </ButtonComponent>
            )
        );
    };

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
                initialState={{
                    columns: {
                        columnVisibilityModel: Object.fromEntries(
                            hiddenColumns.map((hiddenColumn) => [hiddenColumn, false]),
                        ),
                    },
                }}
                autoPageSize
            />
            <Button
                onClick={() => navigateToRoute(`${pathname}/${GlobalConstants.CREATE}`, router)}
            >
                Add New
            </Button>
            <Dialog open={!!clickedRow} onClose={closeDialog}>
                <Form
                    name={name}
                    buttonLabel="save"
                    action={updateRow}
                    defaultValues={clickedRow}
                />
                {getFormActionMsg(dialogActionState)}
                {!!rowActions &&
                    rowActions.map((rowAction) => getRowActionButton(clickedRow, rowAction))}
            </Dialog>
        </Stack>
    );
};

export default Datagrid;
