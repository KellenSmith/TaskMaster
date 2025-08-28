"use client";
import { Stack } from "@mui/material";
import Datagrid, { ImplementedDatagridEntities } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { OrderUpdateSchema } from "../../lib/zod-schemas";
import { GridColDef } from "@mui/x-data-grid";
import { Prisma } from "@prisma/client";

interface OrdersDashboardProps {
    ordersPromise: Promise<
        Prisma.OrderGetPayload<{
            include: {
                user: { select: { nickname: true } };
                order_items: { include: { product: true } };
            };
        }>[]
    >;
}

const OrdersDashboard = ({ ordersPromise }: OrdersDashboardProps) => {
    const customColumns: GridColDef[] = [
        {
            field: GlobalConstants.NICKNAME,
            headerName: "Member nickname",
            valueGetter: (_, order: ImplementedDatagridEntities) =>
                (
                    order as Prisma.OrderGetPayload<{
                        include: {
                            user: { select: { nickname: true } };
                            order_items: { include: { product: true } };
                        };
                    }>
                ).user.nickname,
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
