"use client";

import { Button, Dialog, Stack, useMediaQuery, useTheme, TextField } from "@mui/material";
import {
    DataGrid,
    GridColDef,
    useGridApiRef,
    GridFilterOperator,
    getGridDateOperators,
    getGridStringOperators,
    getGridNumericOperators,
    getGridBooleanOperators,
    GridFilterInputValueProps,
    GridFilterItem,
    GridRowParams,
} from "@mui/x-data-grid";
import React, { useEffect, useMemo, use, useState, useTransition, useCallback } from "react";
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
import { CustomOptionProps } from "./form/AutocompleteWrapper";
import GlobalLanguageTranslations from "../GlobalLanguageTranslations";
import { useUserContext } from "../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";
import { Prisma } from "../../prisma/generated/browser";

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
    | Prisma.ProductGetPayload<true>
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
    onRowClick?: (row: GridRowParams) => void;
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
    const [activeFilterItems, setActiveFilterItems] = useState<GridFilterItem[]>([]);
    const { addNotification } = useNotificationContext();
    const datagridRows = use(dataGridRowsPromise);
    const [clickedRow, setClickedRow] = useState<ImplementedDatagridEntities | null>(null);
    const [addNew, setAddNew] = useState(false);
    const [isPending, startTransition] = useTransition();

    const getColumnType = (fieldKey: string) => {
        if (checkboxFields.includes(fieldKey)) return "boolean";
        if (datePickerFields.includes(fieldKey)) return "date";
        return "string";
    };

    // Custom date filter operators for "after" and "before" filtering
    const getDateFilterOperators = (): GridFilterOperator[] => {
        const defaultOperators = getGridDateOperators();

        // Find and customize the "after" and "before" operators
        const afterOperator = defaultOperators.find((op) => op.value === "after");
        const beforeOperator = defaultOperators.find((op) => op.value === "before");

        // Custom date range filter operator
        const dateRangeOperator: GridFilterOperator = {
            label: "is between",
            value: "between",
            getApplyFilterFn: (filterItem) => {
                if (!filterItem.value || !Array.isArray(filterItem.value)) {
                    return null;
                }
                const [startDate, endDate] = filterItem.value;
                if (!startDate || !endDate) {
                    return null;
                }

                const start = new Date(startDate);
                const end = new Date(endDate);

                // Set start to beginning of day and end to end of day
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);

                return (value) => {
                    if (!value) return false;
                    const cellDate = new Date(value);
                    return cellDate >= start && cellDate <= end;
                };
            },
            InputComponent: (props: GridFilterInputValueProps) => {
                const { item, applyValue } = props;
                const [startDate, endDate] = Array.isArray(item.value) ? item.value : ["", ""];

                const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                    const newValue = [event.target.value, endDate];
                    applyValue({ ...item, value: newValue });
                };

                const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                    const newValue = [startDate, event.target.value];
                    applyValue({ ...item, value: newValue });
                };

                return (
                    <Stack direction="row" spacing={1} marginTop={1}>
                        <TextField
                            label="From"
                            type="date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            slotProps={{
                                inputLabel: { shrink: true },
                            }}
                            size="small"
                        />
                        <TextField
                            label="To"
                            type="date"
                            value={endDate}
                            onChange={handleEndDateChange}
                            slotProps={{
                                inputLabel: { shrink: true },
                            }}
                            size="small"
                        />
                    </Stack>
                );
            },
        };

        // Return only the operators we want to support
        return [dateRangeOperator, afterOperator, beforeOperator].filter(
            Boolean,
        ) as GridFilterOperator[];
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
                ...(datePickerFields.includes(key) && {
                    filterOperators: getDateFilterOperators(),
                    valueGetter: (value) => (value ? new Date(value) : null),
                }),
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

    const isFilterItemApplied = (item: GridFilterItem) => {
        if (item.operator === "isEmpty" || item.operator === "isNotEmpty") {
            return true;
        }

        if (Array.isArray(item.value)) {
            return item.value.some(
                (value) => value !== "" && value !== null && value !== undefined,
            );
        }

        return item.value !== "" && item.value !== null && item.value !== undefined;
    };

    const getFilterOperatorsByType = useCallback((type?: string): GridFilterOperator[] => {
        if (type === "date") return getDateFilterOperators();
        if (type === "number") return getGridNumericOperators();
        if (type === "boolean") return getGridBooleanOperators();
        return getGridStringOperators();
    }, []);

    const filteredRows = useMemo(() => {
        if (activeFilterItems.length === 0) return datagridRows;

        return datagridRows.filter((row) => {
            return activeFilterItems.every((item) => {
                if (!item.field || !item.operator) {
                    return true;
                }

                const column = columns.find((col) => col.field === item.field);
                if (!column) {
                    return true;
                }

                const operators =
                    column.filterOperators && column.filterOperators.length > 0
                        ? column.filterOperators
                        : getFilterOperatorsByType(column.type);

                const operator = operators.find((op) => op.value === item.operator);
                if (!operator || !operator.getApplyFilterFn) {
                    return true;
                }

                const applyFilterFn = operator.getApplyFilterFn(item, column as never);
                if (!applyFilterFn) {
                    return true;
                }

                const rawValue = (row as Record<string, unknown>)[item.field];
                const cellValue = column.valueGetter
                    ? column.valueGetter(rawValue as never, row, column, apiRef as never)
                    : rawValue;

                return applyFilterFn(cellValue, row, column, apiRef as never);
            });
        });
    }, [activeFilterItems, apiRef, columns, datagridRows, getFilterOperatorsByType]);

    useEffect(() => {
        apiRef.current &&
            apiRef.current.autosizeColumns({
                includeOutliers: true,
                includeHeaders: true,
            });
    }, [apiRef, columns]);

    const createRow = async (fieldValues: FormData) => {
        try {
            if (!createAction) throw new Error("No create action provided");
            await createAction(fieldValues);
            setAddNew(false);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const updateRow = async (fieldValues: FormData) => {
        try {
            if (!updateAction) throw new Error("No update action provided");
            if (!clickedRow) throw new Error("No row selected");
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
                if (!clickedRow) throw new Error("No row selected");
                const result = await rowAction.serverAction(clickedRow);
                setClickedRow(null);
                addNotification(result, "success");
            } catch (error) {
                if (error && typeof error === "object" && "message" in error)
                    addNotification(error.message as string, "error");
                throw error;
            }
        });
    };

    const getRowActionButton = (
        clickedRow: ImplementedDatagridEntities | null,
        rowAction: RowActionProps,
    ) => {
        if (!clickedRow) return null;
        const ButtonComponent = rowAction.buttonColor === "error" ? ConfirmButton : Button;
        return (
            rowAction.available(clickedRow) && (
                <ButtonComponent
                    key={rowAction.name}
                    onClick={async () => handleRowAction(rowAction)}
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
                rows={filteredRows}
                onRowClick={(row) =>
                    onRowClick
                        ? onRowClick(row)
                        : (updateAction || rowActions) && setClickedRow(row.row)
                }
                columns={columns}
                initialState={{
                    columns: {
                        columnVisibilityModel: Object.fromEntries(
                            hiddenColumns.map((hiddenColumn) => [hiddenColumn, false]),
                        ),
                    },
                }}
                autoPageSize
                onFilterModelChange={(nextFilterModel) => {
                    const nextFilterItem = nextFilterModel.items[0];

                    setActiveFilterItems((previousItems) => {
                        if (!nextFilterItem || !nextFilterItem.field) {
                            return [];
                        }

                        const itemsWithoutCurrentField = previousItems.filter(
                            (item) => item.field !== nextFilterItem.field,
                        );

                        if (!isFilterItemApplied(nextFilterItem)) {
                            return itemsWithoutCurrentField;
                        }

                        return [...itemsWithoutCurrentField, nextFilterItem];
                    });
                }}
            />
            {createAction && (
                <Button onClick={() => setAddNew(true)}>
                    {LanguageTranslations.addNew[language]}
                </Button>
            )}
            {filteredRowsActions &&
                filteredRowsActions.map((filteredRowsAction) => (
                    <Button
                        key={filteredRowsAction.buttonLabel}
                        onClick={() => {
                            filteredRowsAction.action(
                                filteredRows as ImplementedDatagridEntities[],
                            );
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
                {name && name in RenderedFields && (
                    <Form
                        name={name}
                        buttonLabel={GlobalLanguageTranslations.save[language]}
                        action={clickedRow ? updateRow : createRow}
                        validationSchema={validationSchema}
                        {...(clickedRow
                            ? {
                                  defaultValues: {
                                      ...clickedRow,
                                      ...(getDefaultFormValues
                                          ? getDefaultFormValues(clickedRow)
                                          : []),
                                  },
                              }
                            : {})}
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
