"use client";
import { Stack } from "@mui/material";
import Datagrid, { ImplementedDatagridEntities, RowActionProps } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { deleteProduct, updateProduct } from "../../lib/product-actions";
import { ProductUpdateSchema } from "../../lib/zod-schemas";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import { Prisma } from "../../../prisma/generated/client";

interface ProductsDashboardProps {
    productsPromise: Promise<Prisma.ProductGetPayload<true>[]>;
}

const ProductsDashboard = ({ productsPromise }: ProductsDashboardProps) => {
    const { language } = useUserContext();

    const deleteAction = async (product: ImplementedDatagridEntities) => {
        try {
            await deleteProduct(product.id);
            return GlobalLanguageTranslations.successfulDelete[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedDelete[language]);
        }
    };

    const rowActions: RowActionProps[] = [
        {
            name: GlobalConstants.DELETE,
            serverAction: deleteAction,
            available: () => true,
            buttonColor: "error",
            buttonLabel: GlobalLanguageTranslations.delete[language],
        },
    ];

    const hiddenColumns = [
        GlobalConstants.ID,
        GlobalConstants.DESCRIPTION,
        GlobalConstants.IMAGE_URL,
        GlobalConstants.EMAIL_VERIFIED,
    ];

    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.PRODUCT}
                dataGridRowsPromise={productsPromise}
                updateAction={updateProduct}
                validationSchema={ProductUpdateSchema}
                rowActions={rowActions}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default ProductsDashboard;
