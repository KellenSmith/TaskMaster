"use client";

import { Button, Dialog, Stack, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid, GridColDef, useGridApiRef, gridFilteredSortedRowIdsSelector, gridFilteredSortedRowEntriesSelector } from "@mui/x-data-grid";
import React, { useEffect, useMemo, use, useState, useTransition } from "react";
import {
    checkboxFields,
    datePickerFields,
    FieldLabels,
    priceFields,
    RenderedFields,
} from "./form/FieldCfg";
import Form from "./form/Form";
import ConfirmButton from "./ConfirmButton";
import { formatDate, formatPrice } from "./utils";
import { useNotificationContext } from "../context/NotificationContext";
import { OrderUpdateSchema, ProductUpdateSchema, UserUpdateSchema } from "../lib/zod-schemas";
import { Prisma, Product } from "@prisma/client";
import { CustomOptionProps } from "./form/AutocompleteWrapper";
import GlobalLanguageTranslations from "../GlobalLanguageTranslations";
import { useUserContext } from "../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";

export interface RowActionProps {
    name: string;
    serverAction: (clickedRow: ImplementedDatagridEntities) => Promise<string>; // eslint-disable-line no-unused-vars
    available: (clickedRow: ImplementedDatagridEntities) => boolean; // eslint-disable-line no-unused-vars
    buttonColor?: "inherit" | "error" | "secondary" | "primary" | "success" | "info" | "warning";
    buttonLabel: string;
}

export interface FilteredRowsActionProps {
    // eslint-disable-next-line no-unused-vars
    action: (filteredRows: ImplementedDatagridEntities[]) => Promise<void>;
    buttonColor?: "inherit" | "error" | "secondary" | "primary" | "success" | "info" | "warning";
    buttonLabel: string;
}

export type ImplementedDatagridEntities =
    | Prisma.UserGetPayload<{
        include: {
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
    }>
    | Prisma.NewsletterJobGetPayload<true>;

interface DatagridProps {
    name?: string;
    dataGridRowsPromise: Promise<ImplementedDatagridEntities[]>;
    // eslint-disable-next-line no-unused-vars
    onRowClick?: (row: any) => void;
    updateAction?: (
        rowId: string, // eslint-disable-line no-unused-vars
        fieldValues: FormData, // eslint-disable-line no-unused-vars
    ) => Promise<void>;
    // eslint-disable-next-line no-unused-vars
    createAction?: (fieldValues: FormData) => Promise<void>;
    filteredRowsActions?: FilteredRowsActionProps[];
    validationSchema?:
    | typeof UserUpdateSchema
    | typeof ProductUpdateSchema
    | typeof OrderUpdateSchema;
    rowActions?: RowActionProps[];
    customColumns?: GridColDef[];
    hiddenColumns?: string[];
    // eslint-disable-next-line no-unused-vars
    getDefaultFormValues?: (row: ImplementedDatagridEntities) => Record<string, string | string[]>;
    customFormOptions?: Record<string, CustomOptionProps[]>;
}

const Datagrid: React.FC<DatagridProps> = ({
    name,
    dataGridRowsPromise,
    onRowClick,
    updateAction,
    createAction,
    filteredRowsActions,
    validationSchema,
    rowActions = [],
    customColumns = [],
    hiddenColumns = [],
    getDefaultFormValues,
    customFormOptions = {},
}) => {
    const { language } = useUserContext();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
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
                    if (priceFields.includes(key)) {
                        return formatPrice(value);
                    }
                    if (value in FieldLabels) return FieldLabels[value][language];
                    return value;
                },
            };
        }) as GridColDef[];
        return [...customColumns, ...columns].filter(Boolean) as GridColDef[];
    };
    const columns = useMemo(getColumns, [datagridRows, customColumns, language]);

    useEffect(() => {
        apiRef.current.autosizeColumns({
            includeOutliers: true,
            includeHeaders: true,
        });
    }, [apiRef, columns]);

    const createRow = async (fieldValues: FormData) => {
        try {
            await createAction(fieldValues);
            setAddNew(false);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const updateRow = async (fieldValues: FormData) => {
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

    const getRowActionButton = (
        clickedRow: ImplementedDatagridEntities,
        rowAction: RowActionProps,
    ) => {
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
                onRowClick={(row) => onRowClick ? onRowClick(row) : (updateAction || rowActions) && setClickedRow(row.row)}
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
            {createAction && (
                <Button onClick={() => setAddNew(true)}>
                    {LanguageTranslations.addNew[language]}
                </Button>
            )}
            {filteredRowsActions && filteredRowsActions.map((filteredRowsAction) => (
                <Button
                    key={filteredRowsAction.buttonLabel}
                    onClick={() => {
                        const filteredRows = gridFilteredSortedRowEntriesSelector(apiRef).map(entry => entry.model);
                        filteredRowsAction.action(filteredRows as ImplementedDatagridEntities[]);
                    }}
                    color={filteredRowsAction.buttonColor || "secondary"}
                    disabled={isPending}
                >
                    {filteredRowsAction.buttonLabel}
                </Button>
            ))}
            <Dialog
                fullScreen={isSmallScreen}
                fullWidth
                maxWidth="xl"
                open={clickedRow !== null || addNew}
                onClose={() => {
                    setClickedRow(null);
                    setAddNew(false);
                }}
            >
                {name in RenderedFields && (
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
                )}
                {!addNew &&
                    !!rowActions &&
                    rowActions.map((rowAction) => getRowActionButton(clickedRow, rowAction))}
                <Button
                    onClick={() => {
                        setClickedRow(null);
                        setAddNew(false);
                    }}
                >
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </Stack>
    );
};

export default Datagrid;
