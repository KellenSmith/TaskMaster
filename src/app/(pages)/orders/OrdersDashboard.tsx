"use client";
import { Stack } from "@mui/material";
import Datagrid, { ImplementedDatagridEntities } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { OrderUpdateSchema } from "../../lib/zod-schemas";
import { AllOrdersType, updateOrder } from "../../lib/order-actions";
import z from "zod";
import { GridColDef } from "@mui/x-data-grid";

interface OrdersDashboardProps {
    ordersPromise: Promise<AllOrdersType[]>;
}

const OrdersDashboard = ({ ordersPromise }: OrdersDashboardProps) => {
    const customColumns: GridColDef[] = [
        {
            field: GlobalConstants.NICKNAME,
            headerName: "Member nickname",
            valueGetter: (_, order: ImplementedDatagridEntities) =>
                (order as AllOrdersType).user.nickname,
        },
    ];
    const hiddenColumns = [
        GlobalConstants.ORDER_ITEMS,
        GlobalConstants.USER,
        GlobalConstants.USER_ID,
    ];

    // TODO: If on mobile, minimize content
    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                allowAddNew={false}
                name={GlobalConstants.USER}
                dataGridRowsPromise={ordersPromise}
                validationSchema={OrderUpdateSchema}
                rowActions={[]}
                customColumns={customColumns}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default OrdersDashboard;
