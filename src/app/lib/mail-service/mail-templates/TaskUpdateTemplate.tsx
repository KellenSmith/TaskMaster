import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";

/**
 * Props for the OrderConfirmationTemplate component.
 * @property orderId - The ID of the completed order.
 * @property orderItems - Array of order items with product details.
 * @property totalAmount - The total amount of the order.
 */
interface ITaskUpdateTemplateProps {
    organizationName?: string;
    taskName: string;
    notificationMessage: string;
}

const TaskUpdateTemplate: FC<ITaskUpdateTemplateProps> = ({
    organizationName,
    taskName,
    notificationMessage,
}) => {
    return (
        <MailTemplate organizationName={organizationName}>
            <Text>{`A task you are reviewing has been updated!`}</Text>
            <Text>{`Task Name: ${taskName}`}</Text>
            <Text>{"Message:"}</Text>
            {notificationMessage.split("\n").map((line, index) => (
                <Text key={index}>{line}</Text>
            ))}
        </MailTemplate>
    );
};

export default TaskUpdateTemplate;
