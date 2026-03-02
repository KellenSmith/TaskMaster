"use client";
import { Stack, Typography } from "@mui/material";
import Datagrid, { ImplementedDatagridEntities } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { OrderUpdateSchema } from "../../lib/zod-schemas";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { Cancel, Check, Error, Warning } from "@mui/icons-material";
import { clientRedirect } from "../../lib/utils";
import { useRouter } from "next/navigation";
import { openResourceInNewTab } from "../../ui/utils";
import OrdersReportPDF from "./OrdersReportPDF";
import { pdf } from "@react-pdf/renderer";
import { OrderStatus } from "../../../prisma/generated/enums";
import { Prisma } from "../../../prisma/generated/browser";

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
    const router = useRouter();

    const getStatusConfig = (order: Prisma.OrderGetPayload<true>) => {
        switch (order.status) {
            case OrderStatus.pending:
            case OrderStatus.paid:
            case OrderStatus.shipped:
                return {
                    icon: Warning,
                    color: "warning.main",
                };
            case OrderStatus.completed:
                return {
                    icon: Check,
                    color: "success.main",
                };
            case OrderStatus.cancelled:
                return {
                    icon: Cancel,
                    color: "error.main",
                };
            default:
                return {
                    icon: Error,
                    color: "error.main",
                };
        }
    };

    const customColumns: GridColDef[] = [
        {
            field: GlobalConstants.NICKNAME,
            headerName: LanguageTranslations.nickname[language],
            valueGetter: (_, order: ImplementedDatagridEntities) => {
                const typedOrder = order as Prisma.OrderGetPayload<{
                    include: {
                        user: { select: { nickname: true } };
                        order_items: { include: { product: true } };
                    };
                }>;
                if (!typedOrder.user) return "None";
                return typedOrder.user.nickname;
            },
        },
        {
            field: GlobalConstants.STATUS,
            headerName: "Status",
            type: "string",
            renderCell: (params) => {
                const order: Prisma.OrderGetPayload<true> = params.row;
                const { icon: Icon, color } = getStatusConfig(order);
                const statusText = (FieldLabels[order.status][language] as string) || order.status;
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

    const onRowClick = (clickedRow: GridRowParams) => {
        const order = clickedRow.row as Prisma.OrderGetPayload<true>;
        clientRedirect(router, [GlobalConstants.ORDER], { order_id: order.id });
    };

    const printOrdersReport = async (filteredRows: ImplementedDatagridEntities[]) => {
        const orders = filteredRows as Prisma.OrderGetPayload<{
            include: { order_items: { include: { product: true } } };
        }>[];
        // Generate PDF blob
        const doc = <OrdersReportPDF orders={orders} language={language} />;
        const asPdf = await pdf(doc).toBlob();
        const url = URL.createObjectURL(asPdf);
        openResourceInNewTab(url);
    };

    const filteredRowsActions = [
        {
            action: async (filteredRows: ImplementedDatagridEntities[]) =>
                printOrdersReport(filteredRows),
            buttonLabel: LanguageTranslations.printReport[language],
        },
    ];

    // TODO: If on mobile, minimize content
    // TODO: Extend filter options
    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.USER}
                dataGridRowsPromise={ordersPromise}
                validationSchema={OrderUpdateSchema}
                onRowClick={onRowClick}
                filteredRowsActions={filteredRowsActions}
                customColumns={customColumns}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default OrdersDashboard;
