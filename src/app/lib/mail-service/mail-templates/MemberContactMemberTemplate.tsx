import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { Prisma } from "@prisma/client";

/**
 * Props for the OrderConfirmationTemplate component.
 * @property orderId - The ID of the completed order.
 * @property orderItems - Array of order items with product details.
 * @property totalAmount - The total amount of the order.
 */
interface MemberContactMemberTemplateProps {
    reason: string;
    content: string;
}

const MemberContactMemberTemplate: FC<MemberContactMemberTemplateProps> = async ({
    reason,
    content,
}) => {
    return (
        <MailTemplate>
            <Text>{reason}</Text>
            <Text>{content}</Text>
        </MailTemplate>
    );
};

export default MemberContactMemberTemplate;
