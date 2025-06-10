"use client";
import { Stack } from "@mui/material";
import Datagrid, { RowActionProps } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { completeOrder, getAllOrders } from "../../lib/order-actions";
import { OrderStatus } from "@prisma/client";

const OrdersPage = () => {
    const rowActions: RowActionProps[] = [
        {
            name: OrderStatus.completed,
            serverAction: completeOrder,
            available: (clickedRow) => clickedRow && clickedRow.status === OrderStatus.paid,
            buttonColor: "success",
        },
    ];

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
                rowActions={rowActions}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default OrdersPage;
