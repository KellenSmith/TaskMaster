"use client";
import {
    Card,
    CardContent,
    Stack,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import { OrderStatus, Prisma } from "@prisma/client";
import { formatPrice } from "../../ui/utils";
import { useUserContext } from "../../context/UserContext";
import ProductLanguageTranslations from "../products/LanguageTranslations";
import LanguageTranslations from "./LanguageTranslations";

interface OrderSummaryProps {
    order: Prisma.OrderGetPayload<{
        include: {
            order_items: {
                include: {
                    product: {
                        include: { membership: true };
                    };
                };
            };
        };
    }>;
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
    const { language } = useUserContext();
    const getStatusMessage = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.completed:
                return LanguageTranslations.orderCompleted[language];
            case OrderStatus.paid:
                return LanguageTranslations.orderPaid[language];
            case OrderStatus.pending:
                return LanguageTranslations.orderPending[language];
            case OrderStatus.cancelled:
                return LanguageTranslations.orderCancelled[language];
            default:
                return `${LanguageTranslations.unknownStatus[language]}: ${status}.`;
        }
    };

    return (
        <Card>
            <CardContent>
                <Stack spacing={3}>
                    <Stack
                        direction="row"
                        flexWrap="wrap"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={2}
                    >
                        <Typography variant="h5">
                            {LanguageTranslations.orderSummary[language]}
                        </Typography>
                        <Typography
                            textTransform="capitalize"
                            variant="h6"
                            color="primary"
                            sx={{ minWidth: 180, flexShrink: 0 }}
                        >
                            Status: {LanguageTranslations[order.status][language]}
                        </Typography>
                    </Stack>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{LanguageTranslations.product[language]}</TableCell>
                                    <TableCell align="right">
                                        {ProductLanguageTranslations.price[language] as string}
                                    </TableCell>
                                    <TableCell align="right">
                                        {ProductLanguageTranslations.quantity[language] as string}
                                    </TableCell>
                                    <TableCell align="right">
                                        {ProductLanguageTranslations.total[language] as string}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {order.order_items.map((item) => (
                                    <TableRow key={item.product.name}>
                                        <TableCell component="th" scope="row">
                                            <Stack>
                                                <Typography variant="body1" component="div">
                                                    {item.product.name}
                                                </Typography>
                                                {item.product.membership && (
                                                    <Typography variant="subtitle2" color="warning">
                                                        {
                                                            LanguageTranslations
                                                                .logInToSeeMembership[language]
                                                        }
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatPrice(item.price)} SEK
                                        </TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">
                                            {formatPrice(item.price * item.quantity)} SEK
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <Typography variant="subtitle1">
                                            {LanguageTranslations.total[language]}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="subtitle1">
                                            {formatPrice(order.total_amount)} SEK
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
                <Typography color="primary">{getStatusMessage(order.status)}</Typography>
            </CardContent>
        </Card>
    );
};

export default OrderSummary;
