import { Stack } from "@mui/material";
import Datagrid, { RowActionProps } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { deleteProduct, getAllProducts, updateProduct } from "../../lib/product-actions";

const ProductsPage = () => {
    const rowActions: RowActionProps[] = [
        {
            name: GlobalConstants.DELETE,
            serverAction: deleteProduct,
            available: () => true,
            buttonColor: "error",
        },
    ];

    const hiddenColumns = [GlobalConstants.ID, GlobalConstants.DESCRIPTION];

    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.PRODUCT}
                fetchData={getAllProducts}
                updateAction={updateProduct}
                rowActions={rowActions}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default ProductsPage;
