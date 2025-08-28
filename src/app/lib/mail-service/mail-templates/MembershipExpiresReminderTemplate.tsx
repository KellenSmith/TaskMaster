import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { Prisma } from "@prisma/client";

/**
 * Props for the MembershipExpiresReminderTemplate component.
 * @property organizationSettings - The settings of the organization.
 */
interface IMembershipExpiresReminderTemplateProps {
    organizationSettings: Prisma.OrganizationSettingsGetPayload<true>;
}

const MembershipExpiresReminderTemplate: FC<IMembershipExpiresReminderTemplateProps> = ({
    organizationSettings,
}) => {
    const orgName =
        organizationSettings?.organization_name ||
        process.env.NEXT_PUBLIC_ORGANIZATION_NAME ||
        "Task Master";
    return (
        <MailTemplate organizationName={orgName}>
            <Text>{`Your membership at ${orgName} expires in ${
                organizationSettings?.remind_membership_expires_in_days || 7
            } days. Visit your profile to extend it!`}</Text>
        </MailTemplate>
    );
};

export default MembershipExpiresReminderTemplate;
