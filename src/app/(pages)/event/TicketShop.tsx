"use client";
import { use, useState } from "react";
import { Stack, Typography, useTheme, Button, Dialog, useMediaQuery } from "@mui/material";
import { Prisma, TicketType } from "@prisma/client";
import { useUserContext } from "../../context/UserContext";
import { createOrder } from "../../lib/order-actions";
import { createEventTicket, deleteEventTicket, updateEventTicket } from "../../lib/ticket-actions";
import { isUserAdmin, isUserHost } from "../../lib/utils";
import { isUserVolunteer } from "./event-utils";
import ProductCard from "../../ui/shop/ProductCard";
import Form from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";
import z from "zod";
import { TicketCreateSchema, TicketUpdateSchema } from "../../lib/zod-schemas";
import { allowRedirectException } from "../../ui/utils";
import { useNotificationContext } from "../../context/NotificationContext";
import ConfirmButton from "../../ui/ConfirmButton";
import LanguageTranslations from "./LanguageTranslations";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";

interface TicketShopProps {
    eventPromise: Promise<Prisma.EventGetPayload<true>>;
    eventTicketsPromise: Promise<
        Prisma.TicketGetPayload<{
            include: { product: true };
        }>[]
    >;
    eventTasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>[]
    >;
    goToOrganizeTab: () => void;
}

const TicketShop = ({
    eventPromise,
    eventTicketsPromise,
    eventTasksPromise,
    goToOrganizeTab,
}: TicketShopProps) => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const event = use(eventPromise);
    const tickets = use(eventTicketsPromise);
    const tasks = use(eventTasksPromise);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTicketId, setEditingTicketId] = useState<string | null>(null);

    const createTicketOrder = async (productId: string) => {
        const ticketOrderItems: Prisma.OrderItemCreateManyOrderInput = {
            product_id: productId,
            quantity: 1,
        };
        try {
            await createOrder(user.id, [ticketOrderItems]);
        } catch (error) {
            allowRedirectException(error);
            addNotification(LanguageTranslations.failedTicketOrder[language], "error");
        }
    };

    const createTicketAction = async (formData: FormData) => {
        try {
            await createEventTicket(event.id, formData);
            setDialogOpen(false);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const updateTicketAction = async (formData: FormData) => {
        try {
            await updateEventTicket(editingTicketId, formData);
            setDialogOpen(false);
            setEditingTicketId(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const allowDeleteTicket = (ticket: Prisma.TicketGetPayload<true>) => {
        // There must always be at least one volunteer ticket
        if (ticket.type === TicketType.volunteer)
            return tickets.filter((ticket) => ticket.type === TicketType.volunteer).length >= 2;
        return true;
    };

    const deleteTicketAction = async (ticketId: string) => {
        try {
            await deleteEventTicket(ticketId);
            addNotification(GlobalLanguageTranslations.successfulDelete[language], "success");
        } catch {
            addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
        }
    };

    const isVolunteerTicketAvailable = () => {
        const tasksAssignedToUser = tasks.filter((task) => user && task.assignee_id === user.id);
        return tasksAssignedToUser.length > 0;
    };

    const handleEditTicket = (ticketId: string) => {
        setEditingTicketId(ticketId);
        setDialogOpen(true);
    };

    const getFormDefaultValues = () => {
        if (!editingTicketId) return null;
        const ticket = tickets.find((t) => t.product_id === editingTicketId);
        if (!ticket) return null;
        return { ...ticket, ...ticket.product };
    };

    const getSortedTickets = () => {
        return tickets.sort((ticket1, ticket2) => {
            // First sort by ticket type order (by enum index)
            if (ticket1.type !== ticket2.type) {
                const typeOrder = Object.values(TicketType);
                const index1 = typeOrder.indexOf(ticket1.type);
                const index2 = typeOrder.indexOf(ticket2.type);
                return index1 - index2;
            }
            // Then sort by price (ascending) within each type group
            return ticket1.product.price - ticket2.product.price;
        });
    };

    return (
        <Stack spacing={2} sx={{ padding: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" color={theme.palette.primary.main}>
                    {LanguageTranslations.tickets[language]}
                </Typography>
                {(isUserHost(user, event) || isUserAdmin(user)) && (
                    <Button variant="contained" onClick={() => setDialogOpen(true)} size="small">
                        {LanguageTranslations.addTicket[language]}
                    </Button>
                )}
            </Stack>

            {tickets.length === 0 ? (
                <Typography color="primary">{LanguageTranslations.noTickets[language]}</Typography>
            ) : (
                <Stack direction="row" flexWrap="wrap" gap={2}>
                    {getSortedTickets().map((ticket) => (
                        <Stack key={ticket.product_id}>
                            <ProductCard
                                key={ticket.product_id}
                                product={ticket.product}
                                onAddToCart={createTicketOrder}
                                {...(ticket.type === TicketType.volunteer && {
                                    isAvailable: isVolunteerTicketAvailable(),
                                    makeAvailableText:
                                        LanguageTranslations.unlockVolunteerTicket[language],
                                    onClick: isUserVolunteer(user, tasks)
                                        ? undefined
                                        : goToOrganizeTab,
                                })}
                            />
                            {(isUserHost(user, event) || isUserAdmin(user)) && (
                                <Stack>
                                    <Button onClick={() => handleEditTicket(ticket.product_id)}>
                                        {GlobalLanguageTranslations.edit[language]}
                                    </Button>
                                    {allowDeleteTicket(ticket) && (
                                        <ConfirmButton
                                            color="error"
                                            onClick={() => deleteTicketAction(ticket.product_id)}
                                        >
                                            {GlobalLanguageTranslations.delete[language]}
                                        </ConfirmButton>
                                    )}
                                </Stack>
                            )}
                        </Stack>
                    ))}
                </Stack>
            )}

            <Dialog
                fullScreen={isSmallScreen}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="xl"
                fullWidth
            >
                <Form
                    name={GlobalConstants.TICKET}
                    action={editingTicketId ? updateTicketAction : createTicketAction}
                    defaultValues={getFormDefaultValues()}
                    readOnly={false}
                    editable={false}
                />
                <Button onClick={() => setDialogOpen(false)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </Stack>
    );
};

export default TicketShop;
