import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { OrganizationSettings } from "@prisma/client";

/**
 * Props for the MembershipExpiresReminderTemplate component.
 * @property organizationSettings - The settings of the organization.
 */
interface IMembershipExpiresReminderTemplateProps {
    organizationSettings: OrganizationSettings;
}

const MembershipExpiresReminderTemplate: FC<IMembershipExpiresReminderTemplateProps> = ({
    organizationSettings,
}) => {
    return (
        <MailTemplate>
            <Text>{`Your membership at ${organizationSettings?.organizationName || "Task Master"} expires in ${
                organizationSettings?.remindMembershipExpiresInDays || 7
            } days. Visit your profile to extend it!`}</Text>
        </MailTemplate>
    );
};

export default MembershipExpiresReminderTemplate;
