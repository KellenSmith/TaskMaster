import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { getOrganizationName } from "../../organization-settings-actions";

/**
 * Props for the UserCredentialsTemplate component.
 * @property userEmail - The email address of the user.
 * @property password - The password assigned to the user.
 */
interface IUserCredentialsTemplateProps {
    userEmail: string;
    password: string;
}

const UserCredentialsTemplate: FC<IUserCredentialsTemplateProps> = async ({
    userEmail,
    password,
}) => {
    const organizationName = await getOrganizationName();
    return (
        <MailTemplate>
            <Text>{`You have a new password for your account at ${organizationName}!`}</Text>
            <Text> You can now log in with the following credentials:</Text>
            <Text>Email: {userEmail}</Text>
            <Text>Password: {password}</Text>
        </MailTemplate>
    );
};

export default UserCredentialsTemplate;
