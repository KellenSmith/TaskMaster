"use client";
import { Stack } from "@mui/material";
import Datagrid, { RowActionProps } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { deleteProduct, getAllProducts, updateProduct } from "../../lib/product-actions";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { GridColDef } from "@mui/x-data-grid";

const ProductsPage = () => {
    const rowActions: RowActionProps[] = [
        {
            name: GlobalConstants.DELETE,
            serverAction: deleteProduct,
            available: () => true,
            buttonColor: "error",
        },
    ];

    const customColumns: GridColDef[] = [
        {
            field: GlobalConstants.DURATION,
            headerName: FieldLabels[GlobalConstants.DURATION],
            valueGetter: (_, row) => row.Membership[GlobalConstants.DURATION] || "N/A",
        },
    ];

    const hiddenColumns = [GlobalConstants.ID, GlobalConstants.DESCRIPTION];

    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.MEMBERSHIP}
                fetchData={getAllProducts}
                updateAction={updateProduct}
                rowActions={rowActions}
                customColumns={customColumns}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default ProductsPage;
