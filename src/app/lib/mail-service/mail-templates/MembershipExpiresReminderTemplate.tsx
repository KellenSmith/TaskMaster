import { Text } from "@react-email/components";
import { OrgSettings } from "../../org-settings";
import GlobalConstants from "../../../GlobalConstants";
import MailTemplate from "./MailTemplate";

const MembershipExpiresReminderTemplate = async () => {
    return (
        <MailTemplate>
            <Text>{`Your membership at ${OrgSettings[GlobalConstants.ORG_NAME]} expires in ${
                OrgSettings[GlobalConstants.MEMBERSHIP_EXPIRES_REMINDER]
            } days. Visit your profile to extend it!`}</Text>
        </MailTemplate>
    );
};

export default MembershipExpiresReminderTemplate;
