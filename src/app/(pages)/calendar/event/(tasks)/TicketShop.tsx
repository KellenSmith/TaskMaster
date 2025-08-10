"use client";
import { startTransition, useActionState, useEffect } from "react";
import { getEventTickets } from "../../../../lib/product-actions";
import GlobalConstants from "../../../../GlobalConstants";
import { CircularProgress, Stack, Typography, useTheme } from "@mui/material";
import ProductCard from "../../../../ui/shop/Product";
import { createOrder } from "../../../../lib/order-actions";
import { NextURL } from "next/dist/server/web/next-url";
import { useRouter } from "next/navigation";
import { Product, Event } from "@prisma/client";
import {
    DatagridActionState,
    defaultDatagridActionState,
    defaultFormActionState,
} from "../../../../lib/definitions";

interface TicketShopProps {
    event: Event;
    selectedTasks: { [key: string]: any }[];
}

const TicketShop = ({ event, selectedTasks }: TicketShopProps) => {
    const theme = useTheme();
    const router = useRouter();

    const fetchEventTickets = (currentActionState: DatagridActionState) => {
        const selectedTaskIds = selectedTasks.map((task) => task[GlobalConstants.ID]);
        return getEventTickets(event[GlobalConstants.ID], selectedTaskIds, currentActionState);
    };
    const [fetchTicketsActionState, fetchTicketsAction, isTicketsPending] = useActionState(
        fetchEventTickets,
        defaultDatagridActionState,
    );

    useEffect(() => {
        startTransition(() => fetchTicketsAction());
        // Fetch tickets when selected tasks change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTasks]);

    const createTicketOrder = async (product: Product) => {
        const orderItems = {
            [product.id]: 1,
        };
        const createTicketOrderResult = await createOrder(defaultFormActionState, orderItems);
        if (createTicketOrderResult.status === 201) {
            const orderUrl = new NextURL(`/${GlobalConstants.ORDER}`, window.location.origin);
            orderUrl.searchParams.set(GlobalConstants.ORDER_ID, createTicketOrderResult.result);
            router.push(orderUrl.toString());
        }
    };

    return isTicketsPending ? (
        <CircularProgress />
    ) : (
        <Stack spacing={2} sx={{ padding: 2 }}>
            <Typography variant="h6" color={theme.palette.primary.main}>
                Tickets
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={2}>
                {fetchTicketsActionState.result.map((ticket) => (
                    <ProductCard
                        key={ticket.id}
                        product={ticket.Product}
                        onAddToCart={createTicketOrder}
                    />
                ))}
                {fetchTicketsActionState.result.length === 0 && (
                    <Typography>No tickets available for this event.</Typography>
                )}
            </Stack>
        </Stack>
    );
};

export default TicketShop;
