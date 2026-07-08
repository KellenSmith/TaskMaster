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
            total_vat_amount: true;
        };
    }>;
}

const OrderPaymentConfirmationTemplate: FC<IOrderConfirmationTemplateProps> = ({ order }) => {
    return (
        <MailTemplate>
            <Text>{`Payment has been confirmed for the following order:`}</Text>
            <Text>Order ID: {order.id}</Text>
            <Text style={{ fontWeight: "bold", marginTop: "20px" }}>
                Total: {formatPrice(order.total_amount)} SEK ({formatPrice(order.total_vat_amount)}{" "}
                SEK VAT)
            </Text>
            <Text style={{ marginTop: "20px" }}>
                Manually validate payment. Then mark the order as paid to complete it.
            </Text>
            <Button
                style={mailTheme.components.button}
                href={getAbsoluteUrl([GlobalConstants.ORDER], { order_id: order.id })}
            >
                go to order
            </Button>
        </MailTemplate>
    );
};

export default OrderPaymentConfirmationTemplate;
