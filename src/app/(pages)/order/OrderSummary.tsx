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
    useTheme,
} from "@mui/material";
import { use } from "react";
import { Prisma } from "@prisma/client";

interface OrderSummaryProps {
    orderPromise: Promise<
        Prisma.OrderGetPayload<{ include: { orderItems: { include: { product: true } } } }>
    >;
}

const OrderSummary = ({ orderPromise }: OrderSummaryProps) => {
    const theme = useTheme();
    const order = use(orderPromise);

    return (
        order && (
            <Card>
                <CardContent>
                    <Stack spacing={3}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="h5">Order Summary</Typography>
                            <Typography variant="h6" color="secondary">
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
                                                    <Typography variant="body1">
                                                        {item.product.name}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">{item.price} SEK</TableCell>
                                            <TableCell align="right">{item.quantity}</TableCell>
                                            <TableCell align="right">
                                                {item.price * item.quantity} SEK
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            <Typography variant="subtitle1">Total</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="subtitle1">
                                                {order.totalAmount} SEK
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Stack spacing={1}>
                            <Typography variant="body2" color={theme.palette.text.secondary}>
                                Order ID: {order.id}
                            </Typography>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        )
    );
};

export default OrderSummary;
