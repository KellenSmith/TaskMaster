import { Text } from "@react-email/components";
import MailTemplate, { renderHtml } from "./MailTemplate";
import { FC } from "react";

interface MemberContactMemberTemplateProps {
    reason: string;
    content: string; // HTML content of the message
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
            <Text>{renderHtml(content)}</Text>
        </MailTemplate>
    );
};

export default MemberContactMemberTemplate;
