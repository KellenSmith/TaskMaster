"use client";
import { Stack } from "@mui/material";
import Datagrid from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { getAllOrders } from "../../lib/order-actions";

const OrdersPage = () => {
    const hiddenColumns = [
        GlobalConstants.ID,
        GlobalConstants.USER_CREDENTIALS,
        GlobalConstants.CONSENT_TO_NEWSLETTERS,
    ];

    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.USER}
                fetchData={getAllOrders}
                rowActions={[]}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default OrdersPage;
