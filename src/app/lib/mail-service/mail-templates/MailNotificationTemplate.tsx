import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { Button, Text } from "@react-email/components";

export type MailButtonLink = {
    buttonName: string;
    url: string;
};

interface EmailNotificationTemplateProps {
    message: string;
    linkButtons?: MailButtonLink[];
}

const EmailNotificationTemplate: FC<EmailNotificationTemplateProps> = async ({
    message,
    linkButtons,
}) => {
    return (
        <MailTemplate>
            {message.split("\n").map((line, index) => (
                <Text key={index}>{line}</Text>
            ))}
            {linkButtons?.map((button, index) => (
                <Button key={index} href={button.url}>
                    {button.buttonName}
                </Button>
            ))}
        </MailTemplate>
    );
};

export default EmailNotificationTemplate;
