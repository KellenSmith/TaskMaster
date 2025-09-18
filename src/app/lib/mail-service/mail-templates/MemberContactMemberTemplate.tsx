import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";

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
            <Text
                style={{
                    fontWeight: "bold",
                    color: "#FFD600",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "16px",
                }}
            >
                <span style={{ marginRight: "8px", fontSize: "18px" }}>⚠️</span>
                Please note that your email address will be revealed to the recipient if you reply
                to this message.
            </Text>
            <Text>{reason}</Text>
            <Text>{content}</Text>
        </MailTemplate>
    );
};

export default MemberContactMemberTemplate;
