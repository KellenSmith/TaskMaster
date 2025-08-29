"use client";
import { Stack } from "@mui/material";
import Datagrid, { ImplementedDatagridEntities, RowActionProps } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { deleteProduct, updateProduct } from "../../lib/product-actions";
import { ProductUpdateSchema } from "../../lib/zod-schemas";
import z from "zod";
import { Product } from "@prisma/client";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import { useNotificationContext } from "../../context/NotificationContext";

const ProductsDashboard = ({ productsPromise }) => {
    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();

    const updateAction = async (
        product: Product,
        parsedFieldValues: z.infer<typeof ProductUpdateSchema>,
    ) => {
        try {
            await updateProduct(product.id, parsedFieldValues);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

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
    ];

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
