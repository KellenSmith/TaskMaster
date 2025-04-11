import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";

const MembershipExpiresReminderTemplate: FC = () => {
    return (
        <MailTemplate>
            <Text>{`Your membership at ${process.env.NEXT_PUBLIC_ORG_NAME} expires in ${
                process.env.MEMBERSHIP_EXPIRES_REMINDER
            } days. Visit your profile to extend it!`}</Text>
        </MailTemplate>
    );
};

export default MembershipExpiresReminderTemplate;
