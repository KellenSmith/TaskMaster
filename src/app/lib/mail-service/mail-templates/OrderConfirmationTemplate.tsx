import { Button, Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { formatPrice } from "../../../ui/utils";
import { Prisma } from "../../../../prisma/generated/client";
import mailTheme from "../mail-theme";
import { getAbsoluteUrl } from "../../utils";
import GlobalConstants from "../../../GlobalConstants";

interface IOrderConfirmationTemplateProps {
    order: Prisma.OrderGetPayload<{
        select: {
            id: true;
            total_amount: true;
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
            <Text>{`If you have any questions or concerns, don't hesitate to contact us at ${process.env.EMAIL}.`}</Text>
            <Text>Go to your order to check its status</Text>
            <Button
                style={mailTheme.components.button}
                href={getAbsoluteUrl([GlobalConstants.ORDER], { order_id: order.id })}
            >
                go to order
            </Button>
        </MailTemplate>
    );
};

export default OrderConfirmationTemplate;
