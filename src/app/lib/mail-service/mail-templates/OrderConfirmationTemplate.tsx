import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";

/**
 * Props for the OrderConfirmationTemplate component.
 * @property orderId - The ID of the completed order.
 * @property orderItems - Array of order items with product details.
 * @property totalAmount - The total amount of the order.
 */
interface IOrderConfirmationTemplateProps {
    orderId: string;
    orderItems: Array<{
        product: {
            name: string;
            description?: string;
        };
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
}

const OrderConfirmationTemplate: FC<IOrderConfirmationTemplateProps> = ({
    orderId,
    orderItems,
    totalAmount,
}) => {
    return (
        <MailTemplate>
            <Text>{`Your order has been completed successfully!`}</Text>
            <Text>Order ID: {orderId}</Text>
            <Text>Order Details:</Text>
            {orderItems.map((item, index) => (
                <div key={index} style={{ marginLeft: "20px", marginBottom: "10px" }}>
                    <Text>
                        • {item.product.name} (Quantity: {item.quantity}) - ${item.price.toFixed(2)}
                    </Text>
                    {item.product.description && (
                        <Text style={{ marginLeft: "20px", fontSize: "14px", color: "#666" }}>
                            {item.product.description}
                        </Text>
                    )}
                </div>
            ))}
            <Text style={{ fontWeight: "bold", marginTop: "20px" }}>
                Total: ${(totalAmount / 100).toFixed(2)}
            </Text>
            <Text style={{ marginTop: "20px" }}>
                Thank you for your purchase with {process.env.NEXT_PUBLIC_ORG_NAME}!
            </Text>
        </MailTemplate>
    );
};

export default OrderConfirmationTemplate;
