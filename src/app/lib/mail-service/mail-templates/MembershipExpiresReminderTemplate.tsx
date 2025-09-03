import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { getOrganizationSettings } from "../../organization-settings-actions";

const MembershipExpiresReminderTemplate: FC = async () => {
    const organizationSettings = await getOrganizationSettings();
    return (
        <MailTemplate>
            <Text>{`Your membership expires in ${
                organizationSettings?.remind_membership_expires_in_days || 7
            } days. Visit your profile to extend it!`}</Text>
        </MailTemplate>
    );
};

export default MembershipExpiresReminderTemplate;
