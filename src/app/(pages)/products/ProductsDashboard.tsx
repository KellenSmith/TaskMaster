"use client";
import { Stack } from "@mui/material";
import Datagrid, { ImplementedDatagridEntities, RowActionProps } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { deleteProduct, updateProduct } from "../../lib/product-actions";
import { ProductUpdateSchema } from "../../lib/zod-schemas";
import z from "zod";
import { Product } from "@prisma/client";

const ProductsDashboard = ({ productsPromise }) => {
    const updateAction = async (
        product: Product,
        parsedFieldValues: z.infer<typeof ProductUpdateSchema>,
    ) => {
        await updateProduct(product.id, parsedFieldValues);
        return "Updated product";
    };
    const deleteAction = async (product: ImplementedDatagridEntities) => {
        await deleteProduct(product as Product);
        return "Deleted product";
    };

    const rowActions: RowActionProps[] = [
        {
            name: GlobalConstants.DELETE,
            serverAction: deleteAction,
            available: () => true,
            buttonColor: "error",
        },
    ];

    const hiddenColumns = [GlobalConstants.ID, GlobalConstants.DESCRIPTION];

    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.PRODUCT}
                dataGridRowsPromise={productsPromise}
                updateAction={updateAction}
                validationSchema={ProductUpdateSchema}
                rowActions={rowActions}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default ProductsDashboard;
