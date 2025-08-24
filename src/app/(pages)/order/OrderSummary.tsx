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

interface OrderSummaryProps {
    order: Prisma.OrderGetPayload<{
        include: {
            orderItems: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>;
}

const OrderSummary = async ({ order }: OrderSummaryProps) => {
    const getStatusMessage = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.completed:
                return "Thank you for your order! Your payment has been processed and your order is complete.";
            case OrderStatus.paid:
                return "Thank you for your order! Your payment has been processed and is being fulfilled.";
            case OrderStatus.pending:
                return "Your order is currently pending payment. Please complete the payment process.";
            case OrderStatus.cancelled:
                return "This order has been cancelled. If you have any questions, please contact support.";
            default:
                return `Your order status is ${status}.`;
        }
    };

    return (
        <Card>
            <CardContent>
                <Stack spacing={3}>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="h5">Order Summary</Typography>
                        <Typography textTransform="capitalize" variant="h6" color="primary">
                            Status: {order.status}
                        </Typography>
                    </Stack>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {order.orderItems.map((item) => (
                                    <TableRow key={item.product.name}>
                                        <TableCell component="th" scope="row">
                                            <Stack>
                                                <Typography variant="body1" component="div">
                                                    {item.product.name}
                                                    {item.product.membership &&
                                                        order.status === OrderStatus.completed && (
                                                            <Typography
                                                                variant="body2"
                                                                color="warning"
                                                            >
                                                                Log in again to use your new
                                                                membership!
                                                            </Typography>
                                                        )}
                                                </Typography>
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
                                        <Typography variant="subtitle1">Total</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="subtitle1">
                                            {formatPrice(order.totalAmount)} SEK
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
