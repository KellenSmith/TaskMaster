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
    const organizationName =
        organizationSettings?.organizationName ||
        process.env.NEXT_PUBLIC_ORGANIZATION_NAME ||
        "Task Master";
    return (
        <MailTemplate organizationName={organizationName}>
            <Text>{`Your membership at ${organizationName} expires in ${
                organizationSettings?.remindMembershipExpiresInDays || 7
            } days. Visit your profile to extend it!`}</Text>
        </MailTemplate>
    );
};

export default MembershipExpiresReminderTemplate;
