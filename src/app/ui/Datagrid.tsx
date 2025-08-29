"use client";

import { Button, Dialog, Stack } from "@mui/material";
import { DataGrid, GridColDef, useGridApiRef } from "@mui/x-data-grid";
import React, { useEffect, useMemo, use, useState, useTransition } from "react";
import { checkboxFields, datePickerFields, FieldLabels, priceFields } from "./form/FieldCfg";
import { usePathname, useRouter } from "next/navigation";
import GlobalConstants from "../GlobalConstants";
import Form from "./form/Form";
import ConfirmButton from "./ConfirmButton";
import { formatDate } from "./utils";
import { useNotificationContext } from "../context/NotificationContext";
import {
    OrderUpdateSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
    UserCreateSchema,
    UserUpdateSchema,
} from "../lib/zod-schemas";
import { Prisma, Product } from "@prisma/client";
import z from "zod";
import { clientRedirect, pathToRoute } from "../lib/definitions";
import { CustomOptionProps } from "./form/AutocompleteWrapper";
import GlobalLanguageTranslations from "../GlobalLanguageTranslations";
import { useUserContext } from "../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";

export interface RowActionProps {
    name: string;
    serverAction: (
        clickedRow: any, // eslint-disable-line no-unused-vars
    ) => Promise<string>;
    available: (clickedRow: any) => boolean; // eslint-disable-line no-unused-vars
    buttonColor?: "inherit" | "error" | "secondary" | "primary" | "success" | "info" | "warning";
    buttonLabel: string;
}

export type ImplementedDatagridEntities =
    | Prisma.UserGetPayload<{
          include: {
              user_credentials: { select: { id: true } };
              user_membership: true;
              skill_badges: true;
          };
      }>
    | Product
    | Prisma.OrderGetPayload<{
          include: {
              user: { select: { nickname: true } };
              order_items: { include: { product: true } };
          };
      }>;

interface DatagridProps {
    allowAddNew?: boolean;
    name: string;
    dataGridRowsPromise: Promise<ImplementedDatagridEntities[]>;
    updateAction?: (
        rowId: string,
        fieldValues: // eslint-disable-line no-unused-vars
        | z.infer<typeof UserUpdateSchema>
            | z.infer<typeof ProductUpdateSchema>
            | z.infer<typeof OrderUpdateSchema>,
    ) => Promise<void>;
    createAction?: (
        fieldValues: // eslint-disable-line no-unused-vars
        | z.infer<typeof UserCreateSchema>
            | z.infer<typeof ProductCreateSchema>
            | z.infer<typeof OrderUpdateSchema>,
    ) => Promise<void>;
    validationSchema:
        | typeof UserUpdateSchema
        | typeof ProductUpdateSchema
        | typeof OrderUpdateSchema;
    rowActions: RowActionProps[];
    customColumns?: GridColDef[];
    hiddenColumns?: string[];
    // eslint-disable-next-line no-unused-vars
    getDefaultFormValues?: (row: ImplementedDatagridEntities) => Record<string, string | string[]>;
    customFormOptions?: Record<string, CustomOptionProps[]>;
}

const Datagrid: React.FC<DatagridProps> = ({
    allowAddNew = true,
    name,
    dataGridRowsPromise,
    updateAction,
    createAction,
    validationSchema,
    rowActions,
    customColumns = [],
    hiddenColumns = [],
    getDefaultFormValues,
    customFormOptions = {},
}) => {
    const { language } = useUserContext();
    const apiRef = useGridApiRef();
    const { addNotification } = useNotificationContext();
    const datagridRows = use(dataGridRowsPromise);
    const [clickedRow, setClickedRow] = useState<ImplementedDatagridEntities | null>(null);
    const [addNew, setAddNew] = useState(false);
    const [isPending, startTransition] = useTransition();

    const getColumnType = (fieldKey: string) => {
        if (checkboxFields.includes(fieldKey)) return "boolean";
        return "string";
    };

    const getColumns = () => {
        if (datagridRows.length < 1) return [];
        const columns: GridColDef[] = Object.keys(datagridRows[0]).map((key) => {
            const customColumn = customColumns.find((col) => col.field === key);
            if (customColumn) return null;
            return {
                field: key,
                headerName: key in FieldLabels ? FieldLabels[key][language] : key,
                type: getColumnType(key),
                valueFormatter: (value) => {
                    if (datePickerFields.includes(key)) {
                        return formatDate(value);
                    }
                    if (priceFields.includes(key)) return parseInt(value) / 100;
                    if (value in FieldLabels) return FieldLabels[value][language];
                    return value;
                },
            };
        }) as GridColDef[];
        return [...customColumns, ...columns].filter(Boolean) as GridColDef[];
    };
    const columns = useMemo(getColumns, [datagridRows, customColumns]);

    useEffect(() => {
        apiRef.current.autosizeColumns({
            includeOutliers: true,
            includeHeaders: true,
        });
    }, [apiRef, columns]);

    const createRow = async (fieldValues: any) => {
        try {
            await createAction(fieldValues);
            setAddNew(false);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const updateRow = async (fieldValues: any) => {
        try {
            await updateAction(clickedRow.id, fieldValues);
            setClickedRow(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
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
                    {rowAction.buttonLabel}
                </ButtonComponent>
            )
        );
    };

    return (
        <Stack sx={{ height: "100%" }}>
            <DataGrid
                apiRef={apiRef}
                rows={datagridRows}
                onRowClick={(row) => updateAction && setClickedRow(row.row)}
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
            {allowAddNew && (
                <Button onClick={() => setAddNew(true)}>
                    {LanguageTranslations.addNew[language]}
                </Button>
            )}
            <Dialog
                fullWidth
                maxWidth="xl"
                open={clickedRow !== null || addNew}
                onClose={() => {
                    setClickedRow(null);
                    setAddNew(false);
                }}
            >
                <Form
                    name={name}
                    buttonLabel={GlobalLanguageTranslations.save[language]}
                    action={clickedRow ? updateRow : createRow}
                    validationSchema={validationSchema}
                    defaultValues={
                        clickedRow && {
                            ...clickedRow,
                            ...(getDefaultFormValues ? getDefaultFormValues(clickedRow) : []),
                        }
                    }
                    readOnly={!updateAction}
                    customOptions={customFormOptions}
                />
                {!addNew &&
                    !!rowActions &&
                    rowActions.map((rowAction) => getRowActionButton(clickedRow, rowAction))}
            </Dialog>
        </Stack>
    );
};

export default Datagrid;
