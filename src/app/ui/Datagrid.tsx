"use client";

import { Button, Dialog, Stack } from "@mui/material";
import { DataGrid, GridColDef, useGridApiRef } from "@mui/x-data-grid";
import React, { useEffect, useMemo, use, useState, useTransition } from "react";
import { checkboxFields, datePickerFields, FieldLabels, priceFields } from "./form/FieldCfg";
import { usePathname, useRouter } from "next/navigation";
import GlobalConstants from "../GlobalConstants";
import Form from "./form/Form";
import ConfirmButton from "./ConfirmButton";
import { navigateToRoute, formatDate } from "./utils";
import { useNotificationContext } from "../context/NotificationContext";
import { ProductUpdateSchema, UserUpdateSchema } from "../lib/zod-schemas";
import { Prisma, Product } from "@prisma/client";
import z from "zod";

export interface RowActionProps {
    name: string;
    serverAction: (
        clickedRow: any, // eslint-disable-line no-unused-vars
    ) => Promise<string>;
    available: (clickedRow: any) => boolean; // eslint-disable-line no-unused-vars
    buttonColor?: "inherit" | "error" | "secondary" | "primary" | "success" | "info" | "warning";
}

export type ImplementedDatagridEntities =
    | Prisma.UserGetPayload<{
          include: { userCredentials: true; userMembership: true };
      }>
    | Product;

interface DatagridProps {
    name: string;
    dataGridRowsPromise: Promise<ImplementedDatagridEntities[]>;
    updateAction?: (
        row: ImplementedDatagridEntities, // eslint-disable-line no-unused-vars
        fieldValues: z.infer<typeof UserUpdateSchema>, // eslint-disable-line no-unused-vars
    ) => Promise<string>;
    validationSchema: typeof UserUpdateSchema | typeof ProductUpdateSchema;
    rowActions: RowActionProps[];
    customColumns?: GridColDef[];
    hiddenColumns?: string[];
}

const Datagrid: React.FC<DatagridProps> = ({
    name,
    dataGridRowsPromise,
    updateAction,
    validationSchema,
    rowActions,
    customColumns = [],
    hiddenColumns = [],
}) => {
    const apiRef = useGridApiRef();
    const pathname = usePathname();
    const router = useRouter();
    const { addNotification } = useNotificationContext();
    const datagridRows = use(dataGridRowsPromise);
    const [clickedRow, setClickedRow] = useState<ImplementedDatagridEntities | null>(null);
    const [isPending, startTransition] = useTransition();

    const getColumnType = (fieldKey: string) => {
        if (checkboxFields.includes(fieldKey)) return "boolean";
        return "string";
    };

    const getColumns = () => {
        if (datagridRows.length < 1) return [];
        const columns: GridColDef[] = Object.keys(datagridRows[0]).map((key) => ({
            field: key,
            headerName: key in FieldLabels ? FieldLabels[key] : key,
            type: getColumnType(key),
            valueFormatter: (value) => {
                if (datePickerFields.includes(key)) {
                    return formatDate(value);
                }
                if (priceFields.includes(key)) return parseInt(value) / 100;
                return value;
            },
        })) as GridColDef[];
        return [...columns, ...customColumns];
    };
    const columns = useMemo(getColumns, [datagridRows, customColumns]);

    useEffect(() => {
        apiRef.current.autosizeColumns({
            includeOutliers: true,
            includeHeaders: true,
        });
    }, [apiRef, columns]);

    const updateRow = async (fieldValues: any) => {
        try {
            await updateAction(clickedRow, fieldValues);
            return "Updated successfully";
        } catch {
            addNotification("Failed to update", "error");
        }
    };

    const handleRowAction = (rowAction: RowActionProps) => {
        startTransition(async () => {
            try {
                const result = await rowAction.serverAction(clickedRow);
                setClickedRow(null);
                addNotification(result, "success");
            } catch (error) {
                addNotification(error.message, "error");
            }
        });
    };

    const getRowActionButton = (clickedRow: any, rowAction: RowActionProps) => {
        const ButtonComponent = rowAction.buttonColor === "error" ? ConfirmButton : Button;
        return (
            rowAction.available(clickedRow) && (
                <ButtonComponent
                    key={rowAction.name}
                    onClick={() => handleRowAction(rowAction)}
                    color={rowAction.buttonColor || "secondary"}
                    disabled={isPending}
                >
                    {FieldLabels[rowAction.name]}
                </ButtonComponent>
            )
        );
    };

    return (
        <Stack sx={{ height: "100%" }}>
            <DataGrid
                apiRef={apiRef}
                rows={datagridRows}
                onRowClick={(row) => setClickedRow(row.row)}
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
            <Dialog open={clickedRow !== null} onClose={() => setClickedRow(null)}>
                <Form
                    name={name}
                    buttonLabel="save"
                    action={updateRow}
                    validationSchema={validationSchema}
                    defaultValues={clickedRow}
                    readOnly={!updateAction}
                />
                {!!rowActions &&
                    rowActions.map((rowAction) => getRowActionButton(clickedRow, rowAction))}
            </Dialog>
        </Stack>
    );
};

export default Datagrid;
