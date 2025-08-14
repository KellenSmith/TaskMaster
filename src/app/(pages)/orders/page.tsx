"use client";
import { Stack } from "@mui/material";
import Datagrid from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { getAllOrders } from "../../lib/order-actions";
import { GridColDef } from "@mui/x-data-grid";
import { Prisma } from "@prisma/client";

const OrdersPage = () => {
    const hiddenColumns = [
        GlobalConstants.ID,
        GlobalConstants.USER_CREDENTIALS,
        GlobalConstants.CONSENT_TO_NEWSLETTERS,
        GlobalConstants.ORDER_ITEMS,
    ];

    const customColumns: GridColDef[] = [
        {
            field: "order-items",
            headerName: "orderItems",
            valueGetter: (_, row: Prisma.OrderGetPayload<{ include: { orderItems: true } }>) => {
                return row.orderItems?.length || 0;
            },
        },
    ];

    // TODO: If on mobile, just show list of pending members, viewable and validatable
    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.USER}
                fetchData={getAllOrders}
                rowActions={[]}
                hiddenColumns={hiddenColumns}
                customColumns={customColumns}
            />
        </Stack>
    );
};

export default OrdersPage;
