"use client";
import { Stack } from "@mui/material";
import Datagrid, { ImplementedDatagridEntities } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { OrderUpdateSchema } from "../../lib/zod-schemas";
import { GridColDef } from "@mui/x-data-grid";
import { Prisma } from "@prisma/client";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import { FieldLabels } from "../../ui/form/FieldCfg";

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
    const { language } = useUserContext();

    const customColumns: GridColDef[] = [
        {
            field: GlobalConstants.NICKNAME,
            headerName: LanguageTranslations.nickname[language],
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
        {
            field: GlobalConstants.PAYMENT_REQUEST_ID,
            headerName: FieldLabels[GlobalConstants.PAYMENT_REQUEST_ID][language] as string,
            type: "boolean",
            valueGetter: (_, order: ImplementedDatagridEntities) =>
                !!(
                    order as Prisma.OrderGetPayload<{
                        include: {
                            user: { select: { nickname: true } };
                            order_items: { include: { product: true } };
                        };
                    }>
                ).payment_request_id,
        },
        {
            field: GlobalConstants.PAYEE_REF,
            headerName: FieldLabels[GlobalConstants.PAYEE_REF][language] as string,
            type: "boolean",
            valueGetter: (_, order: ImplementedDatagridEntities) =>
                !!(
                    order as Prisma.OrderGetPayload<{
                        include: {
                            user: { select: { nickname: true } };
                            order_items: { include: { product: true } };
                        };
                    }>
                ).payee_ref,
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
