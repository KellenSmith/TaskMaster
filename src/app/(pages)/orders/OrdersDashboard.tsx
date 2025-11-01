"use client";
import { Stack, Typography } from "@mui/material";
import Datagrid, { ImplementedDatagridEntities } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { OrderUpdateSchema } from "../../lib/zod-schemas";
import { GridColDef } from "@mui/x-data-grid";
import { OrderStatus, Prisma } from "@prisma/client";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { Cancel, Check, Error, Warning } from "@mui/icons-material";
import { clientRedirect } from "../../lib/utils";
import { useRouter } from "next/navigation";

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
    const router = useRouter()

    const getStatusConfig = (order: Prisma.OrderGetPayload<true>) => {
        switch (order.status) {
            case OrderStatus.pending:
            case OrderStatus.paid:
            case OrderStatus.shipped:
                return {
                    status: order.status,
                    icon: Warning,
                    color: "warning.main",
                };
            case OrderStatus.completed:
                return {
                    status: order.status,
                    icon: Check,
                    color: "success.main",
                };
            case OrderStatus.cancelled:
                return {
                    status: order.status,
                    icon: Cancel,
                    color: "error.main",
                };

            default:
                return {
                    status: order.status,
                    icon: Error,
                    color: "error.main",
                };
        }
    };

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
            field: GlobalConstants.STATUS,
            headerName: "Status",
            type: "string",
            valueGetter: (_, order: Prisma.OrderGetPayload<true>) => {
                const { status } = getStatusConfig(order);
                return status;
            },
            renderCell: (params) => {
                const order: Prisma.OrderGetPayload<true> = params.row;
                const { status, icon: Icon, color } = getStatusConfig(order);
                const statusText = (FieldLabels[status][language] as string) || status;
                return (
                    <Stack
                        height="100%"
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        gap={1}
                    >
                        <Icon sx={{ color }} />
                        <Typography variant="body2" sx={{ color }}>
                            {statusText}
                        </Typography>
                    </Stack>
                );
            },
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

    const onRowClick = (order: Prisma.OrderGetPayload<true>) =>
        clientRedirect(router, [GlobalConstants.ORDER], { order_id: order.id });


    // TODO: If on mobile, minimize content
    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.USER}
                dataGridRowsPromise={ordersPromise}
                validationSchema={OrderUpdateSchema}
                onRowClick={onRowClick}
                customColumns={customColumns}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default OrdersDashboard;
