import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { formatPrice } from "../../../ui/utils";
import { Prisma } from "@prisma/client";

/**
 * Props for the OrderConfirmationTemplate component.
 * @property orderId - The ID of the completed order.
 * @property orderItems - Array of order items with product details.
 * @property totalAmount - The total amount of the order.
 */
interface IOrderConfirmationTemplateProps {
    order: Prisma.OrderGetPayload<{
        include: {
            order_items: { include: { product: { select: { name: true; description: true } } } };
        };
    }>;
}

const OrderConfirmationTemplate: FC<IOrderConfirmationTemplateProps> = ({ order }) => {
    return (
        <MailTemplate>
            <Text>{`Your order has been completed successfully!`}</Text>
            <Text>Order ID: {order.id}</Text>
            <Text>Order Details:</Text>
            {order.order_items.map((item, index) => (
                <div key={index} style={{ marginLeft: "20px", marginBottom: "10px" }}>
                    <Text>
                        • {item.product.name} (Quantity: {item.quantity}) -{" "}
                        {formatPrice(item.price)} SEK
                    </Text>
                    {item.product.description && (
                        <Text style={{ marginLeft: "20px", fontSize: "14px", color: "#666" }}>
                            {item.product.description}
                        </Text>
                    )}
                </div>
            ))}
            <Text style={{ fontWeight: "bold", marginTop: "20px" }}>
                Total: {formatPrice(order.total_amount)} SEK
            </Text>
            <Text style={{ marginTop: "20px" }}>Thank you for your purchase!</Text>
        </MailTemplate>
    );
};

export default OrderConfirmationTemplate;
